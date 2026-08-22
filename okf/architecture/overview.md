---
okf_version: "1.0"
title: "Architecture Overview"
description: "High-level system architecture of the AI Email Manager"
---

# Architecture Overview

The Email-Manager is a **multi-process, multi-language monorepo** with three independently-running services.

## Process Map

```
┌─────────────────────┐     HTTP (port 5173)      ┌─────────────────────────────┐
│   React Frontend    │ ←————————————————————————→ │    Node.js/Express Backend  │
│  (Vite, port 5173)  │    Fetch + httpOnly cookies │       (port 5000)           │
└─────────────────────┘                            └─────────────┬───────────────┘
                                                                  │
                                              gRPC (port 50052)*  │
                                                                  ▼
                                                   ┌─────────────────────────┐
                                                   │   Python gRPC Service   │
                                                   │   (port 50051 per code) │
                                                   │  EmailSearchService     │
                                                   └─────────────────────────┘
                                                                  │
                                            ┌─────────────────────┴──────────────┐
                                            ▼                                    ▼
                                   ┌─────────────────┐              ┌────────────────────┐
                                   │    ChromaDB      │              │      MongoDB        │
                                   │  (local persist) │              │  (ai_email_manager) │
                                   └─────────────────┘              └────────────────────┘
```

> **Port discrepancy**: `python-service/server.py` binds port `50051`, but the backend's `hybridSearchClient.js` connects to port `50052`. See [operations/known-issues.md](../operations/known-issues.md).

## External Systems

```
Google OAuth / Gmail API ←—— Backend (googleapis SDK)
Google Calendar API      ←—— Backend (googleapis SDK)
Google Pub/Sub           ——→ Backend /webhook/gmail
Google Gemini AI API     ←—— Python service (google-genai SDK)
Twilio SMS API           ←—— Backend (twilio SDK)
```

## Service Responsibilities

| Service | Language | Port | Responsibility |
|---|---|---|---|
| `frontend/` | React 19 + TypeScript + Tailwind | 5173 | User interface, client-side routing |
| `backend/` | Node.js 20 + Express 5 + Mongoose | 5000 | REST API, OAuth, webhooks, orchestration |
| `python-service/` | Python 3 + gRPC | 50051 | Embedding, vector search, AI Q&A streaming |
| `classifier-service/` | Python 3 | — | Incomplete — stub only, not used |

## Key Architectural Decisions

1. **httpOnly cookies for auth** — Access token (JWT, 15m) and refresh token (opaque, 7d) are stored as httpOnly cookies, never accessible to JavaScript.
2. **Token rotation** — Every token refresh rotates both tokens. Reused tokens trigger session termination.
3. **gRPC for AI pipeline** — Hybrid search and streaming Q&A are delegated to the Python service via gRPC for performance isolation.
4. **Fire-and-forget embedding** — On webhook receipt, vector embedding is async and non-blocking; email is saved regardless of embedding success.
5. **Client-side router** — No React Router; `App.jsx` uses `window.history.pushState` and `popstate` events for routing.

## Data Stores

- **MongoDB** (`ai_email_manager` database) — users, emails, categories, chatSessions (Node.js via Mongoose; Python via pymongo directly)
- **ChromaDB** (local persistent) — vector embeddings, stored at `python-service/chroma_data/`

## Entry Points

- Backend: `backend/src/index.js` — loads `.env`, connects MongoDB, starts Express
- Frontend: `frontend/index.html` → `frontend/src/main.jsx` → `frontend/src/App.jsx`
- Python gRPC: `python-service/server.py`
