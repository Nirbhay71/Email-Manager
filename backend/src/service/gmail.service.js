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

export async function getNewMessagesSince(tokens, startHistoryId){
    const gmail = gmailClient(tokens);
    const historyRes = await gmail.users.history.list({
        userId: "me",
        startHistoryId,
        historyTypes: ["messageAdded"]
    });

    const history = historyRes.data.history || [];
    const messageIds = new Set();

    for(const record of history){
        for(const added of record.messagesAdded || []){
            messageIds.add(added.message.id);
        }
    }

    return Array.from(messageIds);

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
    return {id: messageId, subject, from, body};
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