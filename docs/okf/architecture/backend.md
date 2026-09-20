---
okf_version: "1.0"
title: "Backend Architecture"
description: "Node.js/Express backend structure, middleware, and module organization"
---

# Backend Architecture

**Defined in**: `backend/`  
**Runtime**: Node.js (ES Modules — `"type": "module"`)  
**Framework**: Express 5  
**Entry**: `backend/src/index.js` → `backend/src/app.js`

## Startup Sequence

```
backend/src/index.js
  dotenv.config({ path: './src/.env' })
  → connectDB()             (backend/src/db/index.db.js)
  → app.listen(PORT || 5000)
```

## Module Structure

```
backend/src/
├── index.js              # Entry: load env, connect DB, start server
├── app.js                # Express app: middleware, route registration
├── .env                  # Secrets (gitignored)
├── config/
│   └── google.config.js  # getOAuthClient() factory for googleapis OAuth2Client
├── controllers/
│   ├── auth.controllers.js      # googleLogin, googleCallback, refreshTokensHandler, logout, getMe
│   ├── calendar.controllers.js  # getCalendarEvents
│   ├── category.controllers.js  # getCategories, createCategory
│   ├── chat.controllers.js      # getSessions, createSession, updateSessionStatus
│   ├── email.controllers.js     # getInboxEmails
│   └── webhook.controllers.js   # handleGmailWebhook (full pipeline)
├── db/
│   └── index.db.js       # Mongoose connect (reads MONGODB_URI)
├── grpc/
│   └── hybridSearchClient.js    # gRPC client → python-service (port 50052)
├── middleware/
│   └── auth.middleware.js       # requireAuth — verifies accessToken JWT cookie
├── models/
│   ├── user.model.js            # User (see database.md)
│   ├── email.model.js           # Email
│   ├── category.model.js        # Category
│   └── chatSession.model.js     # ChatSession
├── routes/
│   ├── auth.routes.js           # /auth/*
│   ├── ask.routes.js            # /ask (SSE streaming)
│   ├── calendar.routes.js       # /calendar/*
│   ├── category.routes.js       # /categories/*
│   ├── chat.routes.js           # /chat/*
│   ├── email.routes.js          # /emails/*
│   ├── search.routes.js         # /search/v2
│   └── webhook.routes.js        # /webhook/gmail
├── service/                     # Google API wrappers (no "s")
│   ├── gmail.service.js          # startWatch, getNewMessagesSince, getMessage
│   ├── calendar.service.js       # createDeadlineEvent, listCalendarEvents
│   ├── dateExtractor.service.js  # extractDate() — regex-based date parser
│   └── sms.service.js            # sendTestSms() — Twilio
└── services/                    # gRPC wrappers (with "s")
    └── embeddingClient.js        # embedAndStoreEmail() — gRPC EmbedAndStore
```

## CORS Configuration

```javascript
// app.js
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true   // Required for cookie cross-origin
})
```

## Route Protection

All routes are either public or guarded by `requireAuth` middleware:

| Route prefix | Protected | Notes |
|---|---|---|
| `GET /` | No | Welcome page |
| `/auth/*` (google, callback, refresh) | No | OAuth flow + token refresh |
| `POST /auth/logout`, `GET /auth/me` | Yes | Needs valid session |
| `/webhook/*` | No | Called by Google Pub/Sub |
| `/ask`, `/search`, `/emails`, `/categories`, `/calendar`, `/chat` | Yes | All require accessToken cookie |
| `GET /test-ai` | No | Developer panel (HTML page) |

## Key Dependencies

| Package | Purpose |
|---|---|
| express ^5.2.1 | HTTP server |
| mongoose ^9.7.4 | MongoDB ODM |
| jsonwebtoken ^9.0.3 | JWT sign/verify |
| cookie-parser ^1.4.7 | Parse httpOnly cookies |
| googleapis ^173.0.0 | Google OAuth, Gmail, Calendar |
| @grpc/grpc-js ^1.14.4 | gRPC client |
| @grpc/proto-loader ^0.8.1 | Load .proto files at runtime |
| twilio ^6.0.2 | SMS |
| cors ^2.8.6 | CORS handling |
| dotenv ^17.4.2 | Env loading |
| nodemon ^3.1.14 | Dev server restart |
