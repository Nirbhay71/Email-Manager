---
okf_version: "1.0"
title: "Database Architecture"
description: "MongoDB models, ChromaDB usage, and data relationships"
---

# Database Architecture

## MongoDB (`ai_email_manager`)

Accessed by:
- **Backend** via Mongoose (`MONGODB_URI` env var) — `backend/src/db/index.db.js`
- **Python service** directly via pymongo (`MONGO_URI` env var) — `python-service/services/keyword_store.py`

### Models

#### `User` — `backend/src/models/user.model.js`

```
Collection: users
```

| Field | Type | Notes |
|---|---|---|
| `email` | String | Unique, required |
| `avtar` | String | Google profile picture URL (note: typo in field name) |
| `tokens.access_token` | String | Google OAuth access token (for Gmail/Calendar API) |
| `tokens.refresh_token` | String | Google OAuth refresh token |
| `tokens.scope` | String | OAuth scopes granted |
| `tokens.token_type` | String | Usually "Bearer" |
| `tokens.expiry_date` | Number | Unix ms timestamp |
| `historyId` | String | Gmail history ID for Pub/Sub change detection |
| `isActive` | Boolean | Default null |
| `refreshTokens[]` | Array | Our own rotating refresh tokens (NOT Google's) |
| `refreshTokens[].token` | String | Opaque hex-encoded token (64 bytes) |
| `refreshTokens[].expiresAt` | Date | 7-day expiry |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

**Indexes**: `{ "refreshTokens.expiresAt": 1 }` for TTL-style cleanup

**Important**: `tokens` = Google credentials; `refreshTokens` = our JWT rotation tokens. These are distinct.

---

#### `Email` — `backend/src/models/email.model.js`

```
Collection: emails
```

| Field | Type | Notes |
|---|---|---|
| `userEmail` | String | Owner's email (tenant isolation) |
| `messageId` | String | Gmail message ID (unique) |
| `from` | String | Sender (may include name: `"Name <email>"`) |
| `to` | String | Recipient |
| `subject` | String | Email subject |
| `body` | String | Plain text body |
| `detectedDate` | String | ISO date if deadline found (YYYY-MM-DD), else null |
| `calendarEventId` | String | Google Calendar event ID, if created |
| `smsSent` | Boolean | Whether SMS notification was sent |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

**Indexes**:
- `{ messageId: 1 }` — unique
- `{ subject: "text", body: "text" }` — MongoDB text search (used by Python `keyword_store.py`)

---

#### `Category` — `backend/src/models/category.model.js`

```
Collection: categories
```

| Field | Type | Notes |
|---|---|---|
| `userEmail` | String | Owner's email (tenant isolation) |
| `name` | String | Category name |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

**Indexes**: `{ userEmail: 1, name: 1 }` unique — prevents duplicate category names per user

---

#### `ChatSession` — `backend/src/models/chatSession.model.js`

```
Collection: chatsessions
```

| Field | Type | Notes |
|---|---|---|
| `userEmail` | String | Owner's email |
| `title` | String | Session title |
| `status` | String | Enum: `ACTIVE`, `ARCHIVED`, `SHARED` (default: `ACTIVE`) |
| `messages[]` | Array | Chat message history |
| `messages[].role` | String | Enum: `user`, `ai` |
| `messages[].content` | String | Message text |
| `messages[].timestamp` | Date | Message timestamp |
| `messages[].metadata` | Mixed | E.g., `{ sources: [...] }` for AI responses |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

---

## ChromaDB (Vector Store)

**Used by**: `python-service/services/vector_store.py`  
**Persistence path**: `python-service/chroma_data/` (gitignored)  
**Collection name**: `emails`  
**Distance metric**: cosine (`hnsw:space: cosine`)

| Field | Description |
|---|---|
| `ids` | Gmail `messageId` |
| `embeddings` | Dense float vector from SentenceTransformer |
| `metadatas.user_email` | Email owner (used for tenant-isolated filtering) |
| `metadatas.subject` | Email subject |

**Privacy**: ChromaDB queries always filter by `where: { user_email: <owner> }` — different users cannot see each other's vectors.

## Data Relationships

```
User (1) ───── (many) Email      (via userEmail)
User (1) ───── (many) Category   (via userEmail)
User (1) ───── (many) ChatSession (via userEmail)
Email.messageId ═══════════════ ChromaDB.ids (same messageId used as vector ID)
```
