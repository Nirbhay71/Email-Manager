---
okf_version: "1.0"
title: "API Endpoints Overview"
description: "All HTTP REST endpoints and their implementations"
---

# API Endpoints Overview

**Base URL**: `http://localhost:5000`  
**Frontend API client**: `frontend/src/utils/api.ts` — `apiFetch(path)`

## Public Endpoints (no auth required)

| Method | Path | Controller/Handler | Description |
|---|---|---|---|
| `GET` | `/` | `app.js` inline | Welcome message |
| `GET` | `/auth/google` | `auth.controllers.js → googleLogin` | Redirect to Google OAuth consent screen |
| `GET` | `/auth/google/callback` | `auth.controllers.js → googleCallback` | OAuth code exchange, issue JWT cookies |
| `POST` | `/auth/refresh` | `auth.controllers.js → refreshTokensHandler` | Rotate access + refresh tokens (uses cookie) |
| `POST` | `/webhook/gmail` | `webhook.controllers.js → handleGmailWebhook` | Google Pub/Sub Webhook receiver |
| `GET` | `/test-ai` | `app.js` inline | Developer HTML panel |

## Protected Endpoints (require `accessToken` cookie)

### Auth

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/auth/me` | `auth.controllers.js → getMe` | Returns `{ email, avatar }` for current user |
| `POST` | `/auth/logout` | `auth.controllers.js → logout` | Invalidates current device's refresh token |

### Emails

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/emails/inbox` | `email.controllers.js → getInboxEmails` | Returns paginated inbox (query: `?limit=N`, default 20, max 100) |

**Response shape** (`GET /emails/inbox`):
```json
{
  "emails": [{
    "id": "...", "messageId": "...", "from": "...", "to": "...",
    "subject": "...", "preview": "first 120 chars of body",
    "receivedAt": "...", "detectedDate": "...", "calendarEventId": "...",
    "smsSent": true, "senderName": "...", "senderEmail": "..."
  }],
  "total": 20
}
```

### AI Q&A

| Method | Path | Route file | Description |
|---|---|---|---|
| `POST` | `/ask` | `ask.routes.js` | SSE stream — AI answer from hybrid search + Gemini |

**Request body**: `{ question: string, sessionId?: string }`  
**Response**: `text/event-stream` — events: `data: { text_delta?, is_final?, sources?, error? }`

### Hybrid Search

| Method | Path | Route file | Description |
|---|---|---|---|
| `POST` | `/search/v2` | `search.routes.js` | Hybrid BM25 + vector search |

**Request body**: `{ query: string, limit?: number, offset?: number }`  
**Response**: `{ results[], total, query_interpretation, timings, degraded, stages_timed_out }`  
> ⚠️ May not be functional — see [operations/known-issues.md](../operations/known-issues.md)

### Categories

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/categories` | `category.controllers.js → getCategories` | List all categories for current user |
| `POST` | `/categories` | `category.controllers.js → createCategory` | Create a new category |

**POST body**: `{ name: string }`  
**409 Conflict** if category name already exists for user.

### Calendar

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/calendar/events` | `calendar.controllers.js → getCalendarEvents` | List Google Calendar events for user |

**Query params**: `?timeMin=ISO&timeMax=ISO` (both required)  
**Response**: `{ email, events[], hasEvents, total }`

### Chat Sessions

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/chat/sessions` | `chat.controllers.js → getSessions` | List all chat sessions for user (sorted by `updatedAt` desc) |
| `POST` | `/chat/sessions` | `chat.controllers.js → createSession` | Create new chat session |
| `PATCH` | `/chat/sessions/:id` | `chat.controllers.js → updateSessionStatus` | Update session status (ACTIVE/ARCHIVED/SHARED) |

**POST body**: `{ title?: string }` (default: "New Conversation")  
**PATCH body**: `{ status: "ACTIVE" | "ARCHIVED" | "SHARED" }`

## Error Response Format

```json
{ "error": "Human-readable message", "code"?: "MACHINE_CODE" }
```

Known codes: `ACCESS_EXPIRED` (401, triggers client-side refresh)
