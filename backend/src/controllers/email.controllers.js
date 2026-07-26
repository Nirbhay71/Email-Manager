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

export const getInboxEmails = async (req, res) => {
    try {
        const { userEmail } = req.query;

        if (!userEmail) {
            return res.status(400).json({ error: "userEmail query param required" });
        }

        const limit = parseLimit(req.query.limit);
        const emails = await Email.find({ userEmail })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select("messageId from to subject body detectedDate calendarEventId smsSent createdAt")
            .lean();

        res.json({
            emails: emails.map(toInboxEmail),
            total: emails.length
        });
    } catch (error) {
        console.error("[emails] inbox error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
