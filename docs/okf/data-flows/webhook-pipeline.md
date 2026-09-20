---
okf_version: "1.0"
title: "Webhook → Pipeline Flow"
description: "End-to-end data flow from Google Pub/Sub notification to stored email, vector, calendar event, and SMS"
---

# Webhook → Pipeline Flow

See also: [domains/email-ingestion.md](../domains/email-ingestion.md) for full detail.

## Sequence Diagram

```
Google Pub/Sub
  │
  └── POST /webhook/gmail
        Body: { message: { data: "<base64>" } }
        base64 decodes to: { emailAddress: "user@gmail.com", historyId: "12345" }

backend/src/routes/webhook.routes.js
  → webhook.controllers.js → handleGmailWebhook()

  1. User lookupEmail
     MongoDB: User.findOne({ email: emailAddress })
     → user.tokens (Google OAuth), user.historyId (last seen)

  2. Gmail History API
     gmail.service.js → getNewMessagesSince(user.tokens, startHistoryId)
     → Google API: users.history.list (messageAdded only)
     → Returns: Set<messageId>

  3. For each messageId (deduplicated):

     a. MongoDB: Email.findOne({ messageId }) → skip if exists

     b. gmail.service.js → getMessage(user.tokens, messageId)
        → Google API: messages.get (format: full)
        → Parses: Subject header, From header, body (plain text, recursive)

     c. dateExtractor.service.js → extractDate(subject + " " + body)
        → Regex: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/
        → Returns: "YYYY-MM-DD" or null

     d. MongoDB: Email.create({ userEmail, messageId, from, to, subject, body, detectedDate })

     e. [fire-and-forget]
        services/embeddingClient.js → embedAndStoreEmail({ messageId, userEmail, subject, body })
        → gRPC EmbedAndStore → python-service/server.py
        → embedder.embed(subject + " " + body)
        → vector_store.store_email_vector(messageId, vector, userEmail, subject)
        → ChromaDB upsert

     f. [if detectedDate]
        calendar.service.js → createDeadlineEvent(user.tokens, { title, isoDate, description })
        → Google Calendar API: events.insert (primary calendar)
        → Event with 24h popup + email reminders
        → emailRecord.calendarEventId = event.id → save

     g. [if detectedDate]
        sms.service.js → sendTestSms("Deadline ... found in ...")
        → Twilio API: messages.create
        → emailRecord.smsSent = true → save

  4. user.historyId = newHistoryId → user.save()

  5. res.status(200).send("ok")   [always 200, even on error — prevents Pub/Sub retry loops]
```

## Critical Design Notes

- **Always 200 to Google**: Webhook responds 200 even on internal errors to prevent Pub/Sub from retrying thousands of times.
- **Idempotent**: Emails are skipped if `messageId` already exists (`findOne` before `create`). Catch on `code: 11000` for race conditions.
- **Non-blocking embedding**: `embedAndStoreEmail` is fire-and-forget — email saves to MongoDB regardless of embedding success.
- **Dual token stores**: `user.tokens` = Google OAuth tokens (for Gmail/Calendar); `user.refreshTokens` = our JWT rotation tokens. Do not confuse.
