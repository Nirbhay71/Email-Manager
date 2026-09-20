import { Email } from "../models/email.model.js";

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
            .select("messageId from to subject body detectedDate calendarEventId smsSent createdAt")
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
