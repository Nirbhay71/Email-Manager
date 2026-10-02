import { User } from "../models/user.model.js";
import { runExclusive, syncUserHistory } from "../service/ingest.service.js";

/**
 * POST /webhook/gmail — Pub/Sub push notification that a user's mailbox changed.
 *
 * Acknowledged immediately: fetching, embedding and classifying can take far
 * longer than Pub/Sub's ack deadline, and an unacknowledged push gets retried
 * (re-running the same work). The actual sync runs in the background,
 * serialized per user by runExclusive.
 */
export const handleGmailWebhook = async (req, res) => {
    let decoded;
    try {
        const { message } = req.body;
        if (!message?.data) return res.status(204).end();
        decoded = JSON.parse(Buffer.from(message.data, "base64").toString("utf-8"));
    } catch {
        // Malformed payload — ack so Pub/Sub doesn't retry it forever.
        return res.status(204).end();
    }

    res.status(204).end();

    const { emailAddress, historyId } = decoded || {};
    if (!emailAddress || !historyId) return;

    try {
        if (!(await User.exists({ email: emailAddress }))) return;
        await runExclusive(emailAddress, () => syncUserHistory(emailAddress, String(historyId)));
    } catch (error) {
        console.error("[webhook] background sync error:", error.message);
    }
};
