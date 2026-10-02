import { google } from "googleapis";
import { getOAuthClient } from "../config/google.config.js";

function gmailClient(tokens){
    const auth = getOAuthClient();
    auth.setCredentials(tokens);
    return google.gmail({version: "v1", auth});
}

export async function startWatch(tokens) {
    const gmail = gmailClient(tokens);
    const res = await gmail.users.watch({
        userId: "me",
        requestBody: {
            topicName: process.env.GMAIL_PUBSUB_TOPIC,
            labelIds: ["INBOX"],
            labelFilterAction: "include"
        }
    });

    return res.data;
}

/**
 * Message ids added to the inbox since `startHistoryId`, following every page.
 * Also returns the mailbox's current historyId to resume from next time.
 * Throws with err.code === 404 when startHistoryId is too old for Gmail to
 * replay (roughly a week) — callers fall back to listRecentMessageIds.
 */
export async function getNewMessagesSince(tokens, startHistoryId){
    const gmail = gmailClient(tokens);
    const messageIds = new Set();
    let pageToken;
    let latestHistoryId = startHistoryId;

    do {
        const historyRes = await gmail.users.history.list({
            userId: "me",
            startHistoryId,
            historyTypes: ["messageAdded"],
            labelId: "INBOX",
            pageToken
        });

        for (const record of historyRes.data.history || []) {
            for (const added of record.messagesAdded || []) {
                messageIds.add(added.message.id);
            }
        }
        if (historyRes.data.historyId) latestHistoryId = historyRes.data.historyId;
        pageToken = historyRes.data.nextPageToken;
    } while (pageToken);

    return { messageIds: Array.from(messageIds), historyId: latestHistoryId };
}

/**
 * Ids of the most recent inbox messages, newest first — used to import a
 * user's existing mail on first sign-in and to recover from a stale historyId.
 */
export async function listRecentMessageIds(tokens, { max = 200, newerThanDays = 30 } = {}) {
    const gmail = gmailClient(tokens);
    const ids = [];
    let pageToken;

    do {
        const res = await gmail.users.messages.list({
            userId: "me",
            labelIds: ["INBOX"],
            q: `newer_than:${newerThanDays}d`,
            maxResults: Math.min(100, max - ids.length),
            pageToken
        });
        for (const m of res.data.messages || []) ids.push(m.id);
        pageToken = res.data.nextPageToken;
    } while (pageToken && ids.length < max);

    return ids;
}

export async function stopWatch(tokens) {
    const gmail = gmailClient(tokens);
    await gmail.users.stop({ userId: "me" });
}

/** True when Google says our stored refresh token is no longer usable. */
export function isInvalidGrant(err) {
    return err?.response?.data?.error === "invalid_grant" || /invalid_grant/.test(err?.message || "");
}

export async function getMessage(tokens, messageId) {
    const gmail = gmailClient(tokens);
    const res = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full"
    });
    
    const headers = res.data.payload.headers || [];
    const subject = headers.find((h)=> h.name === "Subject")?.value || "";
    const from = headers.find((h)=> h.name === "From")?.value || "";
    const body = extractPlainText(res.data.payload);
    // Gmail's own receipt timestamp — used as the reference point for
    // relative dates ("tomorrow") found in the email, so they resolve
    // against when the email was sent, not whenever this is processed.
    const receivedAt = res.data.internalDate ? new Date(Number(res.data.internalDate)) : new Date();
    return {id: messageId, subject, from, body, receivedAt};
}

function extractPlainText(payload){
    if (payload.mimeType === "text/plain" && payload.body?.data) {
        return Buffer.from(payload.body.data, "base64").toString("utf-8");
    }
    if (payload.parts) {
        for (const part of payload.parts) {
            const text = extractPlainText(part);
            if (text) return text;
        }
    }
    return "";
}