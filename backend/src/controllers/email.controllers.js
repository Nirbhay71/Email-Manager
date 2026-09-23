import { Email } from "../models/email.model.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { createDeadlineEvent, deleteDeadlineEvent } from "../service/calendar.service.js";
import { storeManualLabel, recordFeedback } from "../grpc/classifierClient.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseLimit(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return DEFAULT_LIMIT;
    return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function parseSender(from = "") {
    const match = from.match(/^(.*?)\s*<([^>]+)>$/);
    if (!match) {
        return {
            senderName: from || "Unknown Sender",
            senderEmail: ""
        };
    }

    return {
        senderName: match[1].replace(/^"|"$/g, "").trim() || match[2],
        senderEmail: match[2].trim()
    };
}

function toPreview(body = "") {
    return body.replace(/\s+/g, " ").trim().slice(0, 120);
}

function toInboxEmail(email) {
    const sender = parseSender(email.from);

    return {
        id: email._id?.toString(),
        messageId: email.messageId,
        from: email.from,
        to: email.to,
        subject: email.subject || "(No Subject)",
        preview: toPreview(email.body),
        receivedAt: email.createdAt,
        detectedDate: email.detectedDate,
        calendarEventId: email.calendarEventId,
        smsSent: email.smsSent,
        category: email.category,
        needsReview: email.needsReview,
        ...sender
    };
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePage(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 1 : Math.max(parsed, 1);
}

/**
 * GET /emails/inbox?page=1&limit=8&filter=deadlines&q=text
 * Always scoped to the authenticated user. `filter=deadlines` keeps only emails
 * where a date was detected; `q` matches subject or sender (case-insensitive, literal text).
 */
export const getInboxEmails = async (req, res) => {
    try {
        // Email is taken from the verified JWT — client cannot spoof another user
        const userEmail = req.user.email;
        const limit = parseLimit(req.query.limit);
        const page = parsePage(req.query.page);

        const scope = { userEmail };
        const deadlineScope = { ...scope, detectedDate: { $nin: [null, ""] } };

        const query = req.query.filter === "deadlines" ? { ...deadlineScope } : { ...scope };
        const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
        if (q) {
            const pattern = new RegExp(escapeRegex(q), "i");
            query.$or = [{ subject: pattern }, { from: pattern }];
        }

        const [total, allCount, deadlineCount] = await Promise.all([
            Email.countDocuments(query),
            Email.countDocuments(scope),
            Email.countDocuments(deadlineScope)
        ]);

        const pages = Math.max(Math.ceil(total / limit), 1);
        const safePage = Math.min(page, pages);

        const emails = await Email.find(query)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * limit)
            .limit(limit)
            .select("messageId from to subject body detectedDate calendarEventId smsSent category needsReview createdAt")
            .lean();

        res.json({
            emails: emails.map(toInboxEmail),
            total,
            page: safePage,
            pages,
            limit,
            counts: { all: allCount, deadlines: deadlineCount }
        });
    } catch (error) {
        console.error("[emails] inbox error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /emails/:id — full body for one email, for the inbox's "open mail" view.
 * Scoped to the authenticated user so ids can't be probed cross-account.
 */
export const getEmailById = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const email = await Email.findOne({ _id: req.params.id, userEmail }).lean();
        if (!email) return res.status(404).json({ error: "Email not found" });

        const sender = parseSender(email.from);
        res.json({
            id: email._id.toString(),
            messageId: email.messageId,
            from: email.from,
            to: email.to,
            subject: email.subject || "(No Subject)",
            body: email.body,
            receivedAt: email.createdAt,
            detectedDate: email.detectedDate,
            calendarEventId: email.calendarEventId,
            smsSent: email.smsSent,
            category: email.category,
            confidence: email.confidence,
            needsReview: email.needsReview,
            classifyReasoning: email.classifyReasoning,
            ...sender
        });
    } catch (error) {
        if (error.name === "CastError") return res.status(404).json({ error: "Email not found" });
        console.error("[emails] get by id error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * POST /emails/:id/calendar-event — user-triggered creation of the deadline event
 * for an email that already has a detected date. Dates are only ever detected
 * automatically; putting them on the calendar is an explicit user action.
 */
export const createEmailCalendarEvent = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const email = await Email.findOne({ _id: req.params.id, userEmail });
        if (!email) return res.status(404).json({ error: "Email not found" });

        if (email.calendarEventId) {
            return res.status(409).json({ error: "This email already has a calendar event", calendarEventId: email.calendarEventId });
        }
        if (!email.detectedDate) {
            return res.status(400).json({ error: "No date was detected for this email" });
        }

        const user = await User.findOne({ email: userEmail }).select("email tokens");
        const tokens = user?.tokensPlain;
        if (!tokens?.access_token && !tokens?.refresh_token) {
            return res.status(401).json({ error: "Google Calendar is not connected for this user" });
        }

        const event = await createDeadlineEvent(tokens, {
            title: `Deadline: ${email.subject}`,
            isoDate: email.detectedDate,
            description: `Added from email sent by ${email.from}`
        });

        email.calendarEventId = event.id;
        await email.save();

        res.json({ calendarEventId: event.id, htmlLink: event.htmlLink || "" });
    } catch (error) {
        if (error.name === "CastError") return res.status(404).json({ error: "Email not found" });
        console.error("[emails] create calendar event error:", error);
        res.status(500).json({ error: "Unable to create calendar event" });
    }
};

/**
 * DELETE /emails/:id/calendar-event — undo a previously-added deadline event.
 */
export const removeEmailCalendarEvent = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const email = await Email.findOne({ _id: req.params.id, userEmail });
        if (!email) return res.status(404).json({ error: "Email not found" });

        if (!email.calendarEventId) {
            return res.status(400).json({ error: "This email has no calendar event" });
        }

        const user = await User.findOne({ email: userEmail }).select("email tokens");
        const tokens = user?.tokensPlain;
        if (!tokens?.access_token && !tokens?.refresh_token) {
            return res.status(401).json({ error: "Google Calendar is not connected for this user" });
        }

        await deleteDeadlineEvent(tokens, email.calendarEventId);

        email.calendarEventId = null;
        await email.save();

        res.json({ success: true });
    } catch (error) {
        if (error.name === "CastError") return res.status(404).json({ error: "Email not found" });
        console.error("[emails] remove calendar event error:", error);
        res.status(500).json({ error: "Unable to remove calendar event" });
    }
};

/**
 * POST /emails/:id/category — assign or correct an email's category.
 *
 * A single endpoint handles both cases: if the email has never had a category
 * (never manually labeled, never auto-classified), this is the user's first
 * label and goes to the classifier as a fresh training example. If it already
 * has one — even an auto-predicted one awaiting review — this is feedback
 * (a confirmation if the same category is re-picked, a correction otherwise),
 * which lets the classifier clean up the old vector example instead of just
 * adding a duplicate.
 */
export const setEmailCategory = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const category = typeof req.body.category === "string" ? req.body.category.replace(/\s+/g, " ").trim() : "";
        if (!category) return res.status(400).json({ error: "category is required" });

        const email = await Email.findOne({ _id: req.params.id, userEmail });
        if (!email) return res.status(404).json({ error: "Email not found" });

        const categoryDoc = await Category.findOne({ userEmail, name: category });
        if (!categoryDoc) return res.status(404).json({ error: "Category not found" });

        // Already confirmed-assigned to this exact category — nothing to do.
        if (email.category === category && !email.needsReview) {
            return res.json({ category: email.category, needsReview: false, noop: true });
        }

        const emailContent = {
            email_id: email.messageId,
            subject: email.subject || "",
            body_snippet: (email.body || "").slice(0, 500),
            sender: email.from
        };

        const hadPriorAssignment = Boolean(email.category);
        const grpcResult = hadPriorAssignment
            ? await recordFeedback(userEmail, emailContent, email.category, category)
            : await storeManualLabel(userEmail, emailContent, category);

        email.category = category;
        email.needsReview = false;
        email.confidence = null;
        email.classifyReasoning = null;
        await email.save();

        res.json({
            category: email.category,
            needsReview: false,
            categoryCount: grpcResult.category_count,
            thresholdCrossed: grpcResult.threshold_crossed
        });
    } catch (error) {
        if (error.name === "CastError") return res.status(404).json({ error: "Email not found" });
        console.error("[emails] set category error:", error);
        res.status(500).json({ error: "Unable to set category" });
    }
};
