import { User } from "../models/user.model.js";
import { Email } from "../models/email.model.js";
import { getNewMessagesSince, getMessage } from "../service/gmail.service.js";
import { extractDate } from "../service/dateExtractor.service.js";
import { createDeadlineEvent } from "../service/calendar.service.js";
import { sendTestSms } from "../service/sms.service.js";
import { embedAndStoreEmail } from "../services/embeddingClient.js";
import { classifyEmail } from "../grpc/classifierClient.js";

export const handleGmailWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message?.data) {
            return res.status(200).send("no data");
        }

        const decoded = JSON.parse(
            Buffer.from(message.data, "base64").toString("utf-8")
        );

        const { emailAddress, historyId: newHistoryId } = decoded;
        console.log(`[webhook] notification for ${emailAddress}, historyId=${newHistoryId}`);

        const user = await User.findOne({ email: emailAddress });
        if (!user) {
            console.warn(`[webhook] no user record for ${emailAddress}`);
            return res.status(200).send("unknown user");
        }

        const startHistoryId = user.historyId || newHistoryId;
        const messageIds = await getNewMessagesSince(user.tokens, startHistoryId);

        for (const id of messageIds) {
            const existingEmail = await Email.findOne({ messageId: id });
            if (existingEmail) continue;

            let msg;
            try {
                msg = await getMessage(user.tokens, id);
            } catch (fetchErr) {
                if (fetchErr?.status === 404 || fetchErr?.code === 404) {
                    // Message was deleted, moved to spam, or was a non-email event (draft/read).
                    // This is normal Gmail Pub/Sub behavior — skip silently.
                    console.log(`[webhook] skipping message ${id} — no longer exists (deleted/spam/draft)`);
                    continue;
                }
                throw fetchErr; // Rethrow unexpected errors
            }
            console.log(`[webhook] new mail: "${msg.subject}" from ${msg.from}`);
            const isoDate = extractDate(`${msg.subject} ${msg.body}`);


            let emailRecord;
            try {
                emailRecord = await Email.create({
                    userEmail: emailAddress,
                    messageId: id,
                    from: msg.from,
                    to: emailAddress,
                    subject: msg.subject,
                    body: msg.body,
                    detectedDate: isoDate
                });

                // Fire-and-forget vector embedding call via gRPC to Python service
                embedAndStoreEmail({
                    messageId: id,
                    userEmail: emailAddress,
                    subject: msg.subject,
                    body: msg.body
                }).catch(embedErr => {
                    console.warn(`[webhook] Vector embedding warning for ${id}: ${embedErr.message}`);
                });

                // Fire-and-forget classification call via gRPC to Python classifier service
                classifyEmail(emailAddress, {
                    email_id: id,
                    subject: msg.subject,
                    body_snippet: msg.body ? msg.body.substring(0, 500) : "",
                    sender: msg.from
                }).then(async (prediction) => {
                    emailRecord.category = prediction.predicted_category || null;
                    emailRecord.confidence = prediction.confidence || 0.0;
                    emailRecord.needsReview = prediction.needs_review || false;
                    emailRecord.classifyReasoning = prediction.reasoning || "";
                    await emailRecord.save();
                    console.log(`[webhook] classified email "${msg.subject}" as "${emailRecord.category}" (confidence: ${emailRecord.confidence.toFixed(2)}, needsReview: ${emailRecord.needsReview})`);
                }).catch(classifyErr => {
                    console.warn(`[webhook] Classification warning for ${id}: ${classifyErr.message}`);
                });
            } catch (dbErr) {
                if (dbErr.code === 11000) {
                    console.log(`[webhook] duplicate email ${id}, skipping`);
                    continue;
                }
                throw dbErr;
            }

            if (!isoDate) {
                console.log("[webhook] no date found, skipping calendar+SMS");
                continue;
            }
            const event = await createDeadlineEvent(user.tokens, {
                title: `Deadline: ${msg.subject}`,
                isoDate,
                description: `Auto-detected from email sent by ${msg.from}`
            });
            console.log(`[webhook] calendar event created: ${event.htmlLink}`);
            
            emailRecord.calendarEventId = event.id;
            await emailRecord.save();

            try {
                const sid = await sendTestSms(
                    `Deadline ${isoDate} found in "${msg.subject}". Calendar event created.`
                );
                console.log(`[webhook] SMS sent, sid=${sid}`);
                emailRecord.smsSent = true;
                await emailRecord.save();
            } catch (smsErr) {
                console.warn(`[webhook] SMS failed (non-fatal): ${smsErr.message}`);
            }
        }
        user.historyId = newHistoryId;
        await user.save();
        res.status(200).send("ok");
    } catch (error) {
        console.error("[webhook] error:", error);
        res.status(200).send("error logged");
    }
};
