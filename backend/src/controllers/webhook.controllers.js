import { User } from "../models/user.model.js";
import { Email } from "../models/email.model.js";
import { Category } from "../models/category.model.js";
import { getNewMessagesSince, getMessage } from "../service/gmail.service.js";
import { extractDate } from "../service/dateExtractor.service.js";
import { sendTestSms } from "../service/sms.service.js";
import { embedAndStoreEmail } from "../service/embeddingClient.js";
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
        const tokens = user.tokensPlain;
        const startHistoryId = user.historyId || newHistoryId;
        const messageIds = await getNewMessagesSince(tokens, startHistoryId);
        // Skip the classify gRPC round-trip entirely for users who haven't
        // created any categories yet — the common case for most users.
        const hasCategories = await Category.exists({ userEmail: emailAddress });
        for (const id of messageIds) {
            const existingEmail = await Email.findOne({ messageId: id });
            if (existingEmail) continue;

            let msg;
            try {
                msg = await getMessage(tokens, id);
            } catch (fetchErr) {
                console.warn(`[webhook] Could not fetch message ${id}, skipping. Error: ${fetchErr.message}`);
                continue;
            }

            console.log(`[webhook] new mail: "${msg.subject}" from ${msg.from}`);
            const isoDate = extractDate(`${msg.subject} ${msg.body}`, msg.receivedAt);

            let emailRecord;
            try {
                emailRecord = await Email.create({
                    userEmail: emailAddress,
                    messageId: id,
                    from: msg.from,
                    to: emailAddress,
                    subject: msg.subject || "(No Subject)", // Fallback if subject is empty
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

                // Fire-and-forget auto-classification, once the user has at least
                // one category to classify into.
                if (hasCategories) {
                    classifyEmail(emailAddress, {
                        email_id: id,
                        subject: msg.subject || "",
                        body_snippet: (msg.body || "").slice(0, 500),
                        sender: msg.from
                    }).then(async (result) => {
                        if (!result || result.predicted_category === "Unclassified") return;
                        await Email.updateOne(
                            { messageId: id, userEmail: emailAddress },
                            {
                                $set: {
                                    category: result.predicted_category,
                                    confidence: result.confidence,
                                    needsReview: result.needs_review,
                                    classifyReasoning: result.reasoning || null
                                }
                            }
                        );
                    }).catch(classifyErr => {
                        console.warn(`[webhook] Classification warning for ${id}: ${classifyErr.message}`);
                    });
                }
            } catch (dbErr) {
                if (dbErr.code === 11000) {
                    console.log(`[webhook] duplicate email ${id}, skipping`);
                    continue;
                }
                console.warn(`[webhook] Failed to save email ${id}: ${dbErr.message}`);
                continue; // Do NOT throw, continue processing the rest
            }

            if (!isoDate) {
                console.log("[webhook] no date found, skipping SMS");
                continue;
            }

            // No longer auto-creating the calendar event here — the user decides
            // per-email via the "Add event" button in the inbox, since not every
            // detected date is actually worth putting on the calendar.
            try {
                const sid = await sendTestSms(
                    `Deadline ${isoDate} found in "${msg.subject}". Add it to your calendar from the inbox if you need it.`
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
