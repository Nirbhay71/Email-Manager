import { User } from "../models/user.model.js";
import { Email } from "../models/email.model.js";
import { Category } from "../models/category.model.js";
import {
    getNewMessagesSince,
    getMessage,
    listRecentMessageIds,
    isInvalidGrant
} from "./gmail.service.js";
import { extractDate } from "./dateExtractor.service.js";
import { sendTestSms } from "./sms.service.js";
import { embedAndStoreEmail } from "./embeddingClient.js";
import { classifyEmail } from "../grpc/classifierClient.js";
import { enqueueClassification, enqueueFinanceExtraction } from "./classifyQueue.js";
import { isFinanceCandidate } from "./financeFilter.service.js";

const BACKFILL_MAX_MESSAGES = Number(process.env.BACKFILL_MAX_MESSAGES) || 200;
const BACKFILL_NEWER_THAN_DAYS = Number(process.env.BACKFILL_NEWER_THAN_DAYS) || 30;

// ─── Per-user serialization ───────────────────────────────────────────────────
// Webhook notifications, the first-login backfill and account deletion all
// touch the same user's mail and historyId. Running them one at a time per
// user avoids double-fetching messages and historyId going backwards.
// In-process only — fine for a single backend instance.
const userQueues = new Map();
const cancelledUsers = new Set();

export function runExclusive(userEmail, task) {
    const previous = userQueues.get(userEmail) || Promise.resolve();
    const next = previous.catch(() => {}).then(task);
    userQueues.set(userEmail, next);
    next.catch(() => {}).finally(() => {
        if (userQueues.get(userEmail) === next) userQueues.delete(userEmail);
    });
    return next;
}

/** Makes an in-flight backfill/sync for this user stop at the next message. */
export function cancelUserWork(userEmail) {
    cancelledUsers.add(userEmail);
}

export function clearCancellation(userEmail) {
    cancelledUsers.delete(userEmail);
}

/** Flags the user for re-login when Google has revoked/expired our access. */
export async function flagIfReauthNeeded(userEmail, err) {
    if (!isInvalidGrant(err)) return false;
    await User.updateOne({ email: userEmail }, { $set: { needsReauth: true } });
    console.warn("[ingest] Google access revoked or expired — user must sign in again");
    return true;
}

// ─── Single message ───────────────────────────────────────────────────────────

/**
 * Fetch one Gmail message and store, embed and classify it.
 * `notify` controls deadline SMS — off for backfilled (old) mail.
 * @returns {Promise<"created"|"skipped"|"failed">}
 */
export async function ingestMessage({ userEmail, tokens, messageId, hasCategories, notify = true }) {
    if (await Email.exists({ messageId })) return "skipped";

    let msg;
    try {
        msg = await getMessage(tokens, messageId);
    } catch (fetchErr) {
        if (isInvalidGrant(fetchErr)) throw fetchErr;
        console.warn(`[ingest] could not fetch message ${messageId}: ${fetchErr.message}`);
        return "failed";
    }

    const isoDate = extractDate(`${msg.subject} ${msg.body}`, msg.receivedAt);

    let emailRecord;
    try {
        emailRecord = await Email.create({
            userEmail,
            messageId,
            from: msg.from || "(Unknown sender)",
            to: userEmail,
            subject: msg.subject || "(No Subject)",
            body: msg.body,
            receivedAt: msg.receivedAt,
            detectedDate: isoDate
        });
    } catch (dbErr) {
        if (dbErr.code === 11000) return "skipped";
        console.warn(`[ingest] failed to save email ${messageId}: ${dbErr.message}`);
        return "failed";
    }

    // Awaited (not fire-and-forget) so a 200-message backfill doesn't flood
    // the embedding service with concurrent requests. Failures are non-fatal:
    // the email is still listed, it just won't show up in semantic search.
    try {
        await embedAndStoreEmail({ messageId, userEmail, subject: msg.subject, body: msg.body });
    } catch (embedErr) {
        console.warn(`[ingest] embedding failed for ${messageId}: ${embedErr.message}`);
    }

    if (hasCategories) {
        // Queued for classifier-service's batch worker, which paces Gemini
        // calls under the API quota. Direct gRPC only if Redis is down.
        try {
            await enqueueClassification(userEmail, messageId);
        } catch (queueErr) {
            console.warn(`[ingest] classify queue unavailable (${queueErr.message}) — classifying directly`);
            await classifyDirectly(userEmail, messageId, msg);
        }
    }

    // Money-related mail is queued for structured extraction regardless of
    // categories. No direct fallback: scripts/reprocess-finance.js re-queues
    // anything missed while Redis was down.
    if (isFinanceCandidate(msg)) {
        try {
            await enqueueFinanceExtraction(userEmail, messageId);
        } catch (queueErr) {
            console.warn(`[ingest] finance queue unavailable (${queueErr.message}) — skipped ${messageId}`);
        }
    }

    // Dates are only detected here; adding them to the calendar is an explicit
    // user action from the inbox. SMS stays gated behind SMS_ENABLED because
    // sendTestSms always texts one fixed TWILIO_TEST_TO_NUMBER.
    if (notify && isoDate && process.env.SMS_ENABLED === "true") {
        try {
            await sendTestSms(
                `Deadline ${isoDate} found in "${msg.subject}". Add it to your calendar from the inbox if you need it.`
            );
            emailRecord.smsSent = true;
            await emailRecord.save();
        } catch (smsErr) {
            console.warn(`[ingest] SMS failed (non-fatal): ${smsErr.message}`);
        }
    }

    return "created";
}

async function classifyDirectly(userEmail, messageId, msg) {
    try {
        const result = await classifyEmail(userEmail, {
            email_id: messageId,
            subject: msg.subject || "",
            body_snippet: (msg.body || "").slice(0, 500),
            sender: msg.from
        });
        if (result && result.predicted_category !== "Unclassified") {
            await Email.updateOne(
                { messageId, userEmail },
                {
                    $set: {
                        category: result.predicted_category,
                        confidence: result.confidence,
                        needsReview: result.needs_review,
                        classifyReasoning: result.reasoning || null
                    }
                }
            );
        }
    } catch (classifyErr) {
        console.warn(`[ingest] classification failed for ${messageId}: ${classifyErr.message}`);
    }
}

async function ingestAll(user, messageIds, { notify }) {
    const tokens = user.tokensPlain;
    const hasCategories = Boolean(await Category.exists({ userEmail: user.email }));
    const counts = { created: 0, skipped: 0, failed: 0 };

    for (const messageId of messageIds) {
        if (cancelledUsers.has(user.email)) break;
        const outcome = await ingestMessage({ userEmail: user.email, tokens, messageId, hasCategories, notify });
        counts[outcome] += 1;
    }
    return counts;
}

// ─── Backfill & incremental sync ──────────────────────────────────────────────

/**
 * Import the user's recent inbox so a new account isn't empty until the next
 * email arrives. Safe to re-run: already-stored messages are skipped.
 */
export async function backfillUser(userEmail) {
    const user = await User.findOne({ email: userEmail });
    if (!user?.tokens) return;

    await User.updateOne({ email: userEmail }, { $set: { backfillStatus: "running" } });
    try {
        const ids = await listRecentMessageIds(user.tokensPlain, {
            max: BACKFILL_MAX_MESSAGES,
            newerThanDays: BACKFILL_NEWER_THAN_DAYS
        });
        const counts = await ingestAll(user, ids, { notify: false });
        if (cancelledUsers.has(userEmail)) return;
        await User.updateOne({ email: userEmail }, { $set: { backfillStatus: "done" } });
        console.log(`[ingest] backfill finished: ${counts.created} new, ${counts.skipped} existing, ${counts.failed} failed`);
    } catch (err) {
        await flagIfReauthNeeded(userEmail, err);
        await User.updateOne({ email: userEmail }, { $set: { backfillStatus: "failed" } });
        console.error("[ingest] backfill failed:", err.message);
    }
}

/**
 * Pull everything added since the user's stored historyId. Falls back to a
 * recent-messages resync when Gmail can no longer replay that far back.
 * @param {string} userEmail
 * @param {string} [notifiedHistoryId] historyId from a Pub/Sub notification
 */
export async function syncUserHistory(userEmail, notifiedHistoryId) {
    const user = await User.findOne({ email: userEmail });
    if (!user?.tokens || user.needsReauth) return;

    const startHistoryId = user.historyId || notifiedHistoryId;
    if (!startHistoryId) return;

    try {
        let messageIds;
        let latestHistoryId;
        try {
            ({ messageIds, historyId: latestHistoryId } = await getNewMessagesSince(user.tokensPlain, startHistoryId));
        } catch (err) {
            if (err.code !== 404 && err.response?.status !== 404) throw err;
            console.warn("[ingest] stored historyId expired — resyncing recent inbox");
            messageIds = await listRecentMessageIds(user.tokensPlain, { max: BACKFILL_MAX_MESSAGES, newerThanDays: 7 });
            latestHistoryId = notifiedHistoryId || startHistoryId;
        }

        const counts = await ingestAll(user, messageIds, { notify: true });
        if (cancelledUsers.has(userEmail)) return;

        // Only ever move historyId forward.
        if (!user.historyId || BigInt(latestHistoryId) > BigInt(user.historyId)) {
            await User.updateOne({ email: userEmail }, { $set: { historyId: String(latestHistoryId) } });
        }
        if (counts.created) console.log(`[ingest] synced ${counts.created} new message(s)`);
    } catch (err) {
        if (!(await flagIfReauthNeeded(userEmail, err))) {
            console.error("[ingest] history sync failed:", err.message);
        }
    }
}
