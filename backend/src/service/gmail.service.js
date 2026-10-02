import { google } from "googleapis";
import { convert } from "html-to-text";
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
    const body = extractReadableText(res.data.payload);
    // Gmail's own receipt timestamp — used as the reference point for
    // relative dates ("tomorrow") found in the email, so they resolve
    // against when the email was sent, not whenever this is processed.
    const receivedAt = res.data.internalDate ? new Date(Number(res.data.internalDate)) : new Date();
    return {id: messageId, subject, from, body, receivedAt};
}

// Inline images above this size are left out rather than bloating the response.
const MAX_INLINE_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Everything needed to display one email: its HTML part (with inline
 * `cid:` images embedded as data: URIs) and a readable plain-text version.
 * Fetched live from Gmail when the user opens an email, so it works for
 * mail stored before HTML was kept, and nothing extra is persisted.
 */
export async function getMessageContent(tokens, messageId) {
    const gmail = gmailClient(tokens);
    const res = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
    const payload = res.data.payload;

    let html = findPart(payload, "text/html");
    const text = extractReadableText(payload);

    if (html) {
        // Inline images: <img src="cid:abc"> refers to a MIME part with Content-ID <abc>.
        const inlineParts = collectParts(payload).filter((p) => p.body?.attachmentId && headerOf(p, "Content-ID"));
        for (const part of inlineParts) {
            const cid = headerOf(part, "Content-ID").replace(/^<|>$/g, "");
            if (!html.includes(`cid:${cid}`) || (part.body.size || 0) > MAX_INLINE_IMAGE_BYTES) continue;
            try {
                const att = await gmail.users.messages.attachments.get({
                    userId: "me", messageId, id: part.body.attachmentId
                });
                const b64 = Buffer.from(att.data.data, "base64url").toString("base64");
                html = html.split(`cid:${cid}`).join(`data:${part.mimeType};base64,${b64}`);
            } catch (err) {
                console.warn(`[gmail] inline image fetch failed: ${err.message}`);
            }
        }
    }

    return { html, text };
}

function collectParts(payload, out = []) {
    out.push(payload);
    for (const part of payload.parts || []) collectParts(part, out);
    return out;
}

function headerOf(part, name) {
    return (part.headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function findPart(payload, mimeType) {
    const part = collectParts(payload).find((p) => p.mimeType === mimeType && p.body?.data);
    return part ? Buffer.from(part.body.data, "base64url").toString("utf-8") : "";
}

/**
 * Plain text for storage, search and the AI: the text/plain part when the
 * sender provided a usable one, otherwise text converted from the HTML part.
 * Some senders put raw CSS (`@media{...}`) at the top of their text/plain
 * part; that is stripped too.
 */
function extractReadableText(payload) {
    const plain = stripLeadingCss(findPart(payload, "text/plain"));
    if (plain.trim()) return plain;
    const html = findPart(payload, "text/html");
    return html ? htmlToPlainText(html) : "";
}

function stripLeadingCss(text) {
    // Drop leading lines that are clearly CSS rules, e.g. "@media{...}" or "div.x{padding:0}".
    const lines = text.split(/\r?\n/);
    let i = 0;
    while (i < lines.length && /^\s*(@media|@font-face|@import|[.#a-z][\w.#\s,:>-]*\{)[^]*[{};]\s*$/i.test(lines[i])) i++;
    return lines.slice(i).join("\n");
}

export function htmlToPlainText(html) {
    return convert(html, {
        wordwrap: false,
        selectors: [
            { selector: "img", format: "skip" },
            { selector: "a", options: { hideLinkHrefIfSameAsText: true, ignoreHref: false } },
            { selector: "style", format: "skip" },
            { selector: "script", format: "skip" }
        ]
    }).trim();
}
