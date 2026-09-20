---
okf_version: "1.0"
title: "Email-Manager OKF Index"
description: "Root navigation map for the AI Email Manager knowledge base"
created: "2026-08-22"
---

# Email-Manager — OKF Knowledge Index

AI-powered email management system. Three separate processes: a **React frontend**, a **Node.js/Express backend**, and a **Python gRPC service** for hybrid search and AI Q&A.

## Quick Navigation

| Topic | File |
|---|---|
| System architecture overview | [architecture/overview.md](./architecture/overview.md) |
| Frontend architecture | [architecture/frontend.md](./architecture/frontend.md) |
| Backend architecture | [architecture/backend.md](./architecture/backend.md) |
| Database models | [architecture/database.md](./architecture/database.md) |
| Auth & JWT flow | [domains/authentication.md](./domains/authentication.md) |
| Email ingestion pipeline | [domains/email-ingestion.md](./domains/email-ingestion.md) |
| AI search & Q&A | [domains/ai-search.md](./domains/ai-search.md) |
| All API endpoints | [apis/overview.md](./apis/overview.md) |
| Frontend → backend data flows | [data-flows/frontend-to-backend.md](./data-flows/frontend-to-backend.md) |
| Authentication flow (step-by-step) | [data-flows/authentication-flow.md](./data-flows/authentication-flow.md) |
| Webhook → pipeline flow | [data-flows/webhook-pipeline.md](./data-flows/webhook-pipeline.md) |
| AI ask/search flow | [data-flows/ai-search-flow.md](./data-flows/ai-search-flow.md) |
| Frontend components | [components/frontend.md](./components/frontend.md) |
| Backend components | [components/backend.md](./components/backend.md) |
| Python gRPC service | [components/python-service.md](./components/python-service.md) |
| Google APIs integration | [integrations/google-apis.md](./integrations/google-apis.md) |
| External services (Twilio, Gemini) | [integrations/external-services.md](./integrations/external-services.md) |
| Environment variables | [configuration/environment-variables.md](./configuration/environment-variables.md) |
| gRPC / Proto contract | [configuration/grpc-proto.md](./configuration/grpc-proto.md) |
| Dev / run / test commands | [operations/development.md](./operations/development.md) |
| Known issues & constraints | [operations/known-issues.md](./operations/known-issues.md) |

## Repository Layout

```
Email-Manager/
├── backend/          # Node.js / Express API server (port 5000)
├── frontend/         # React 19 + Vite + Tailwind SPA (port 5173)
├── python-service/   # Python gRPC search/AI server (port 50051)
├── classifier-service/ # Incomplete Python classifier (stub only)
├── search_feature_demo/ # Prototype / demo — contains the v2 proto file
├── demo/             # Standalone demos (calendar reminder, etc.)
├── okf/              # This knowledge base
└── README.md
```

## Critical Warning

> The backend's gRPC client (`hybridSearchClient.js`) targets **port 50052** and proto package `emailsearch_v2`, but `python-service/server.py` listens on **port 50051** with package `emailsearch`. See [operations/known-issues.md](./operations/known-issues.md) for details.
