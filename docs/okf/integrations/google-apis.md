---
okf_version: "1.0"
title: "Google APIs Integration"
description: "All Google API integrations: OAuth, Gmail, Calendar, Pub/Sub, Gemini"
---

# Google APIs Integration

## Google OAuth 2.0

**SDK**: `googleapis` npm package  
**Client factory**: `backend/src/config/google.config.js → getOAuthClient()`

```javascript
new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)
```

**Consumed by**: `auth.controllers.js`, `gmail.service.js`, `calendar.service.js`

**Scopes requested**:
```
gmail.readonly
calendar.events
userinfo.email
```

**Where credentials are stored**: `User.tokens` in MongoDB (Google's access_token + refresh_token + expiry)

---

## Gmail API

**SDK**: `googleapis` → `google.gmail({ version: 'v1', auth })`  
**File**: `backend/src/service/gmail.service.js`

| Function | Gmail API Call | Purpose |
|---|---|---|
| `startWatch(tokens)` | `users.watch` | Subscribe Gmail inbox to Pub/Sub |
| `getNewMessagesSince(tokens, startHistoryId)` | `users.history.list` | Get new message IDs since last check |
| `getMessage(tokens, messageId)` | `users.messages.get (format: full)` | Fetch full email with headers + body |

**Watch configuration**:
- Topic: `GMAIL_PUBSUB_TOPIC` env var
- Label filter: `INBOX` only
- Returns `historyId` stored on `User.historyId`

---

## Google Calendar API

**SDK**: `googleapis` → `google.calendar({ version: 'v3', auth })`  
**File**: `backend/src/service/calendar.service.js`

| Function | Calendar API Call | Purpose |
|---|---|---|
| `createDeadlineEvent(tokens, { title, isoDate, description })` | `events.insert` | Creates all-day event with 24h popup + email reminders |
| `listCalendarEvents(tokens, { timeMin, timeMax })` | `events.list` | List events in time range |

---

## Google Pub/Sub

**Type**: Push subscription (Google calls our server)  
**Receiver**: `POST /webhook/gmail` → `webhook.controllers.js → handleGmailWebhook()`  
**Payload**: `{ message: { data: "<base64 JSON>" } }` where JSON = `{ emailAddress, historyId }`  
**Required infrastructure**: Google Cloud Pub/Sub topic + subscription configured externally  
**Important**: For HTTPS, backend must be publicly accessible (ngrok in development, per `index.js` startup log)

---

## Gemini AI API

**SDK**: `google.genai` Python package  
**File**: `python-service/services/gemini_service.py`  
**Model**: `gemini-2.5-flash`  
**Mode**: streaming (`generate_content_stream`)  
**Env var**: `GEMINI_API_KEY` in `python-service/.env`

**Prompt template**: System instruction + email excerpts (subject, from, body) + user question  
**Context window**: Up to `top_k=5` emails fetched and formatted as excerpts

---

## Configuration Env Vars

| Variable | Service | Used In |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth | `backend/src/config/google.config.js` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | `backend/src/config/google.config.js` |
| `GOOGLE_REDIRECT_URI` | Google OAuth | `backend/src/config/google.config.js` |
| `GMAIL_PUBSUB_TOPIC` | Gmail Pub/Sub | `backend/src/service/gmail.service.js` |
| `GEMINI_API_KEY` | Gemini | `python-service/services/gemini_service.py` |
