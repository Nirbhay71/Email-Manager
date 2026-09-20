---
okf_version: "1.0"
title: "Environment Variables"
description: "All environment variables by service with their source files and descriptions"
---

# Environment Variables

Environment files are gitignored across all services.

## Backend (`backend/src/.env`)

Loaded at startup by `backend/src/index.js`:
```javascript
dotenv.config({ path: './src/.env' })
```

| Variable | Required | Default | Used In | Description |
|---|---|---|---|---|
| `PORT` | No | `5000` | `index.js` | HTTP listen port |
| `MONGODB_URI` | Yes | — | `db/index.db.js` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | — | `middleware/auth.middleware.js`, `utils/token.utils.js` | Signing secret for 15-min access JWT |
| `FRONTEND_URL` | No | `http://localhost:5173` | `app.js`, `auth.controllers.js` | CORS origin + OAuth redirect destination |
| `NODE_ENV` | No | — | `utils/token.utils.js` | Set to `production` to enable `secure: true` on cookies |
| `GOOGLE_CLIENT_ID` | Yes | — | `config/google.config.js` | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | — | `config/google.config.js` | Google OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | Yes | — | `config/google.config.js` | Must match Google Console redirect URI exactly |
| `GMAIL_PUBSUB_TOPIC` | Yes | — | `service/gmail.service.js` | Full Pub/Sub topic (`projects/<id>/topics/<name>`) |
| `HYBRID_SEARCH_GRPC_HOST` | No | `localhost:50052` | `grpc/hybridSearchClient.js` | Python gRPC service host:port |
| `TWILIO_ACCOUNT_SID` | No | — | `service/sms.service.js` | Twilio SID (SMS skipped if absent) |
| `TWILIO_AUTH_TOKEN` | No | — | `service/sms.service.js` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | No | — | `service/sms.service.js` | Twilio sender phone number |
| `TWILIO_TEST_TO_NUMBER` | No | — | `service/sms.service.js` | Fixed test recipient phone |
| `PUBSUB_AUDIENCE` | No (Yes in prod) | — | `middleware/verifyPubSub.middleware.js` | Full webhook URL registered in Pub/Sub push subscription (e.g. `https://abc.ngrok.io/webhook/gmail`). Enables strict audience check. |
| `PUBSUB_SERVICE_ACCOUNT_EMAIL` | No | — | `middleware/verifyPubSub.middleware.js` | Google service account email that signs push tokens. Adds issuer check on top of signature verification. |

---

## Python Search Service (`python-service/.env`)

Loaded by `python-service/server.py` via `dotenv.load_dotenv()`.

| Variable | Required | Default | Used In | Description |
|---|---|---|---|---|
| `GRPC_PORT` | No | `50051` | `server.py` | gRPC listen port |
| `MONGO_URI` | Yes | `mongodb://localhost:27017/ai_email_manager` | `services/keyword_store.py` | MongoDB connection (same DB as backend) |
| `CHROMA_PERSIST_DIR` | No | `./chroma_data` | `services/vector_store.py` | ChromaDB storage path |
| `EMBEDDING_MODEL` | No | `Alibaba-NLP/gte-Qwen2-1.5B-instruct` | `services/embedder.py` | Primary SentenceTransformer model |
| `EMBEDDING_MODEL_FALLBACK` | No | `BAAI/bge-large-en-v1.5` | `services/embedder.py` | Fallback model if primary fails |
| `GEMINI_API_KEY` | Yes (for AI Q&A) | — | `services/gemini_service.py` | Google Gemini API key |

---

## Classifier Service (`classifier-service/.env`)

This service appears to be a stub/incomplete. Its `.env` has 290 bytes but the service has no entry point file. An `.env` exists but the service is not running.

---

## Frontend (no env file)

The frontend has **no `.env` file** — the backend URL is hardcoded:

```typescript
// frontend/src/utils/api.ts
const BACKEND = 'http://localhost:5000';   // hardcoded
```

To change the backend URL for production, this string must be updated directly.

---

## Critical: Files That Must Change Together

If the MongoDB connection string changes:
- `backend/src/.env` → `MONGODB_URI`
- `python-service/.env` → `MONGO_URI`  
  Both services share the same database.

If the gRPC port changes on the Python side:
- `python-service/.env` → `GRPC_PORT`
- `backend/src/.env` → `HYBRID_SEARCH_GRPC_HOST`  
  Both must use the same port.
