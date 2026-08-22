---
okf_version: "1.0"
title: "Development Operations"
description: "How to run, build, and test each service"
---

# Development Operations

## Running All Services

The system requires **three separate terminal sessions**.

### 1. Backend (Node.js/Express)

```bash
cd backend
npm run dev
# Runs: nodemon src/index.js
# Listens: http://localhost:5000
# Requires: backend/src/.env to exist
```

Pre-requisites:
- MongoDB running (local or Atlas)
- `backend/src/.env` with all required vars (see [configuration/environment-variables.md](../configuration/environment-variables.md))

### 2. Frontend (React/Vite)

```bash
cd frontend
npm run dev
# Listens: http://localhost:5173
# Dev proxy: /api/* → http://localhost:5000
```

### 3. Python gRPC Service

```bash
cd python-service
# Activate venv first:
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Generate proto stubs (only needed once or when proto changes):
python -m grpc_tools.protoc \
  --proto_path=protos \
  --python_out=generated \
  --grpc_python_out=generated \
  protos/search.proto

# Start server:
python server.py
# Listens: port 50051 (GRPC_PORT env)
```

## Build Commands

```bash
# Frontend production build
cd frontend
npm run build
# Output: frontend/dist/

# Frontend preview
cd frontend
npm run preview
```

## Linting

```bash
# Frontend
cd frontend
npm run lint   # Runs oxlint
```

## Test Files (Backend)

Manual test scripts exist in `backend/`:
- `backend/test_ask.js` — Tests the `/ask` SSE endpoint
- `backend/test_integration.js` — Integration tests

```bash
cd backend
node test_ask.js
node test_integration.js
```

## Ngrok (for Pub/Sub Webhooks)

Google Pub/Sub requires a publicly accessible HTTPS URL. Startup log recommends:

```bash
ngrok http 5000
```

Then update Google Pub/Sub subscription push URL to the ngrok HTTPS URL + `/webhook/gmail`.

## Environment Setup Checklist

1. Create `backend/src/.env` from required vars (see [configuration/environment-variables.md](../configuration/environment-variables.md))
2. Create `python-service/.env` (at minimum: `GEMINI_API_KEY`, `MONGO_URI`)
3. Ensure MongoDB is running and accessible at `MONGODB_URI`
4. Generate Python gRPC stubs (`python-m grpc_tools.protoc ...`)
5. Configure Google Cloud Console: OAuth credentials + Pub/Sub topic + subscription
6. Start all three services in separate terminals
7. Expose backend with ngrok if testing Pub/Sub webhooks

## Port Summary

| Service | Port |
|---|---|
| Frontend (Vite) | 5173 |
| Backend (Express) | 5000 |
| Python gRPC service (python-service) | 50051 |
| Backend gRPC client target | 50052 (⚠️ see known-issues) |
