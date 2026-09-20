---
okf_version: "1.0"
title: "Email Ingestion Domain"
description: "Gmail Pub/Sub webhook pipeline: receive → store → embed → calendar → SMS"
---

# Email Ingestion Domain

## Overview

Emails enter the system via **Google Gmail Pub/Sub webhooks**, not user action. The pipeline runs entirely on the backend when Google pushes a notification.

## Trigger

Google sends a `POST /webhook/gmail` with a base64-encoded Pub/Sub message when a new email arrives in the watched inbox.

## Pipeline

```
Google Pub/Sub → POST /webhook/gmail
  → backend/src/routes/webhook.routes.js
  → backend/src/controllers/webhook.controllers.js → handleGmailWebhook()
  │
  ├── 1. Decode base64 Pub/Sub payload → { emailAddress, historyId }
  ├── 2. Find User in MongoDB by emailAddress
  ├── 3. getNewMessagesSince(user.tokens, startHistoryId)
  │       → backend/src/service/gmail.service.js
  │       → Gmail API: users.history.list (historyTypes: messageAdded)
  │       → Returns set of new messageIds
  │
  └── For each new messageId (deduplicated against Email collection):
      │
      ├── 4. getMessage(user.tokens, id)
      │       → gmail.service.js → Gmail API: messages.get (format: full)
      │       → Parses Subject, From, plain text body
      │
      ├── 5. extractDate(subject + body)
      │       → backend/src/service/dateExtractor.service.js
      │       → Regex: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/
      │       → Returns ISO date string or null
      │
      ├── 6. Email.create({ userEmail, messageId, from, to, subject, body, detectedDate })
      │       → MongoDB: emails collection
      │
      ├── 7. embedAndStoreEmail({ messageId, userEmail, subject, body }) [fire-and-forget]
      │       → backend/src/services/embeddingClient.js
      │       → gRPC EmbedAndStore → python-service/server.py
      │       → Embed with SentenceTransformer → store in ChromaDB
      │
      ├── 8. [if detectedDate] createDeadlineEvent(user.tokens, title, isoDate)
      │       → backend/src/service/calendar.service.js
      │       → Google Calendar API: events.insert on primary calendar
      │       → Sets email popup+email reminders 24h before
      │
      └── 9. [if detectedDate] sendTestSms(body)
              → backend/src/service/sms.service.js
              → Twilio: messages.create (from TWILIO_FROM_NUMBER to TWILIO_TEST_TO_NUMBER)
```

## Watch Setup

On every successful OAuth login, `startWatch(tokens)` is called:
- **File**: `backend/src/service/gmail.service.js`
- Calls Gmail API `users.watch` with topic `GMAIL_PUBSUB_TOPIC`
- Watches label: `INBOX` only
- Returns `historyId` stored on `User.historyId` (used as `startHistoryId` for next webhook)

## Error Handling

- Duplicate `messageId` (code 11000) → silently skip, continue
- Failed `getMessage` → log warning, continue to next message  
- Failed embedding → non-fatal warning (email already saved in MongoDB)
- Failed SMS → non-fatal warning (calendar event still created)
- All webhook errors return `200 OK` to Google (prevents retry loops)

## Files Involved

| File | Role |
|---|---|
| `backend/src/routes/webhook.routes.js` | `POST /webhook/gmail` route |
| `backend/src/controllers/webhook.controllers.js` | Full pipeline orchestration |
| `backend/src/service/gmail.service.js` | Gmail API: startWatch, history, getMessage |
| `backend/src/service/dateExtractor.service.js` | Regex date extraction |
| `backend/src/service/calendar.service.js` | Google Calendar event creation |
| `backend/src/service/sms.service.js` | Twilio SMS (fire-and-forget) |
| `backend/src/services/embeddingClient.js` | gRPC EmbedAndStore call |
| `backend/src/grpc/hybridSearchClient.js` | Shared gRPC client |
| `backend/src/models/email.model.js` | Email persistence |
| `backend/src/models/user.model.js` | Read Google tokens + historyId |
| `python-service/server.py` | gRPC EmbedAndStore handler |
| `python-service/services/embedder.py` | SentenceTransformer embedding |
| `python-service/services/vector_store.py` | ChromaDB storage |

## Configuration Dependencies

| Env Var | Used By | Purpose |
|---|---|---|
| `GMAIL_PUBSUB_TOPIC` | `gmail.service.js` | Google Pub/Sub topic name |
| `GOOGLE_CLIENT_ID` | `google.config.js` | OAuth2 client |
| `GOOGLE_CLIENT_SECRET` | `google.config.js` | OAuth2 client |
| `GOOGLE_REDIRECT_URI` | `google.config.js` | OAuth callback URL |
| `TWILIO_ACCOUNT_SID` | `sms.service.js` | Twilio auth |
| `TWILIO_AUTH_TOKEN` | `sms.service.js` | Twilio auth |
| `TWILIO_FROM_NUMBER` | `sms.service.js` | Sender phone |
| `TWILIO_TEST_TO_NUMBER` | `sms.service.js` | Recipient phone |
| `HYBRID_SEARCH_GRPC_HOST` | `hybridSearchClient.js` | Python service host:port |
