---
okf_version: "1.0"
title: "Backend Components"
description: "All backend modules, their responsibilities, and inter-dependencies"
---

# Backend Components

**Base path**: `backend/src/`

## Dependency Graph

```
index.js
  → db/index.db.js          (MongoDB connect)
  → app.js
      → middleware/auth.middleware.js
      → routes/*.routes.js
           → controllers/*.controllers.js
                → models/*.model.js
                → service/*.service.js
                → services/embeddingClient.js
                     → grpc/hybridSearchClient.js
           → routes/ask.routes.js (inline logic)
                → grpc/hybridSearchClient.js
           → routes/search.routes.js (inline logic)
                → grpc/hybridSearchClient.js
      → config/google.config.js     (used by controllers + services)
      → utils/token.utils.js        (used by auth.controllers.js)
```

## Module Details

### Entry & App

| File | Imports | Exports | Description |
|---|---|---|---|
| `index.js` | `dotenv`, `db/index.db.js`, `app.js` | — | Process entry point |
| `app.js` | All routes, `auth.middleware.js` | `app` | Express app factory |

### Config

| File | Imports | Exports | Description |
|---|---|---|---|
| `config/google.config.js` | `googleapis` | `getOAuthClient()` | Creates `OAuth2Client` with GOOGLE_CLIENT_* env vars |

**Used by**: `auth.controllers.js`, `gmail.service.js`, `calendar.service.js`

### Database

| File | Imports | Exports | Description |
|---|---|---|---|
| `db/index.db.js` | `mongoose` | `connectDB()` | Mongoose connect using `MONGODB_URI` |

### Middleware

| File | Imports | Exports | Consumed by |
|---|---|---|---|
| `middleware/auth.middleware.js` | `jsonwebtoken` | `requireAuth` | `app.js` (all protected routes), `auth.routes.js` (me, logout) |

### Models

| File | Mongoose Model | Collection | Key Relations |
|---|---|---|---|
| `models/user.model.js` | `User` | `users` | Has `refreshTokens[]` (our auth) + `tokens` (Google OAuth) |
| `models/email.model.js` | `Email` | `emails` | `userEmail` → User.email; `messageId` → ChromaDB.ids |
| `models/category.model.js` | `Category` | `categories` | `userEmail` → User.email |
| `models/chatSession.model.js` | `ChatSession` | `chatsessions` | `userEmail` → User.email |

### Controllers

| File | Imports | Exported functions |
|---|---|---|
| `controllers/auth.controllers.js` | `googleapis`, `google.config.js`, `user.model.js`, `gmail.service.js`, `token.utils.js` | `googleLogin`, `googleCallback`, `refreshTokensHandler`, `logout`, `getMe` |
| `controllers/email.controllers.js` | `email.model.js` | `getInboxEmails` |
| `controllers/webhook.controllers.js` | `user.model.js`, `email.model.js`, `gmail.service.js`, `dateExtractor.service.js`, `calendar.service.js`, `sms.service.js`, `embeddingClient.js` | `handleGmailWebhook` |
| `controllers/category.controllers.js` | `category.model.js` | `getCategories`, `createCategory` |
| `controllers/chat.controllers.js` | `chatSession.model.js` | `getSessions`, `createSession`, `updateSessionStatus` |
| `controllers/calendar.controllers.js` | `user.model.js`, `calendar.service.js` | `getCalendarEvents` |

### Routes

| File | Mounts at | Imports |
|---|---|---|
| `routes/auth.routes.js` | `/auth` | `auth.controllers.js`, `auth.middleware.js` |
| `routes/email.routes.js` | `/emails` | `email.controllers.js` |
| `routes/webhook.routes.js` | `/webhook` | `webhook.controllers.js` |
| `routes/ask.routes.js` | `/ask` | `hybridSearchClient.js`, `chatSession.model.js` |
| `routes/search.routes.js` | `/search` | `hybridSearchClient.js` |
| `routes/category.routes.js` | `/categories` | `category.controllers.js` |
| `routes/chat.routes.js` | `/chat` | `chat.controllers.js` |
| `routes/calendar.routes.js` | `/calendar` | `calendar.controllers.js` |

### Services (Google API wrappers — `service/` no "s")

| File | Imports | Exports |
|---|---|---|
| `service/gmail.service.js` | `googleapis`, `google.config.js` | `startWatch()`, `getNewMessagesSince()`, `getMessage()` |
| `service/calendar.service.js` | `googleapis`, `google.config.js` | `createDeadlineEvent()`, `listCalendarEvents()` |
| `service/dateExtractor.service.js` | — | `extractDate(text)` — regex only |
| `service/sms.service.js` | `twilio` | `sendTestSms(body)` |

### gRPC Clients (Python bridge — `services/` with "s", `grpc/`)

| File | Imports | Exports |
|---|---|---|
| `grpc/hybridSearchClient.js` | `@grpc/grpc-js`, `@grpc/proto-loader` | `hybridSearchClient` (singleton) |
| `services/embeddingClient.js` | `grpc/hybridSearchClient.js` | `embedAndStoreEmail({ messageId, userEmail, subject, body })` |

**Proto path**: `search_feature_demo/grpc_app/search.proto` (gitignored)  
**Package**: `emailsearch_v2`, **Service**: `SearchService`, **Host**: `HYBRID_SEARCH_GRPC_HOST || 'localhost:50052'`

### Utilities

| File | Exports | Used by |
|---|---|---|
| `utils/token.utils.js` | `signAccessToken`, `generateRefreshToken`, `setAuthCookies`, `clearAuthCookies`, `ACCESS_COOKIE_OPTS`, `REFRESH_COOKIE_OPTS` | `auth.controllers.js` |
