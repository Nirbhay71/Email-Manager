---
okf_version: "1.0"
title: "Known Issues & Architectural Constraints"
description: "Documented inconsistencies, technical debt, and important constraints found in the codebase"
---

# Known Issues & Architectural Constraints

## 🔴 Critical: gRPC Port/Service Mismatch

**Issue**: The backend's gRPC client targets a *different service and port* than what `python-service` implements.

| | Backend client | Python service |
|---|---|---|
| **Proto file** | `search_feature_demo/grpc_app/search.proto` (gitignored) | `python-service/protos/search.proto` |
| **Package** | `emailsearch_v2` | `emailsearch` |
| **Service name** | `SearchService` | `EmailSearchService` |
| **Default port** | `50052` (`HYBRID_SEARCH_GRPC_HOST`) | `50051` (`GRPC_PORT`) |
| **RPCs** | `Search`, `AskQuestion`, `EmbedAndStore` | `EmbedAndStore`, `AskQuestion` |

**Effect**: `POST /search/v2` likely fails entirely. `POST /ask` and `EmbedAndStore` may also fail unless the service name difference is handled transparently or an undocumented second Python process runs on port 50052.

**Files affected**:
- `backend/src/grpc/hybridSearchClient.js` — client config
- `python-service/server.py` — server port and service registration

---

## 🟡 Important: `search_feature_demo/` is Gitignored

The proto file that the backend's gRPC client actually uses (`search_feature_demo/grpc_app/search.proto`) is in a directory listed in the root `.gitignore`. This means:
- It is excluded from version control
- The exact contract for the v2 SearchService cannot be read from the repo
- The `Search` RPC (used by `POST /search/v2`) definition is unavailable

---

## 🟡 Important: `BACKEND` URL Hardcoded in Frontend

**File**: `frontend/src/utils/api.ts`, line 8:
```typescript
const BACKEND = 'http://localhost:5000';
```

There is no `.env` file or Vite env variable used. Changing the backend URL for staging/production requires modifying source code.

---

## 🟡 Important: `classifier-service/` is Incomplete

The `classifier-service/` directory contains:
- `.env` (290 bytes, gitignored)
- `.gitignore`
- `__pycache__/`, `generated/`, `services/`, `chroma_data_classifier/`

But there is **no entry point** (no `server.py`, no `main.py`). The service is not functional. It appears to be an abandoned or in-progress parallel classifier.

---

## 🟡 Important: `avtar` Typo in User Model

**File**: `backend/src/models/user.model.js`, field name: `avtar`  
**Should be**: `avatar`  
**Impact**: The `GET /auth/me` endpoint returns `{ email, avatar }` (correct key name), but reads from `user.avtar` (typo). The frontend (`App.jsx`) expects `data.avatar`. This works correctly only because the controller maps `avtar → avatar` manually.

**Files that must change together if fixing**:
- `backend/src/models/user.model.js` — field definition
- `backend/src/controllers/auth.controllers.js` — `new User(... avtar ...)`, `user.avtar`

---

## 🟡 Important: LoginPage.tsx Google Button Positional Coupling

**File**: `frontend/src/App.jsx`
```jsx
style={{ left: 'max(32px, calc(50% - 528px))', top: '598px' }}
```

The Google OAuth button is an invisible overlay positioned at hardcoded pixel values over `LoginPage.tsx`. If the generated login page layout changes, the button will be misaligned/invisible.

---

## 🔵 Minor: SMS Destination is Hardcoded Test Number

**File**: `backend/src/service/sms.service.js`  
SMS is always sent to `TWILIO_TEST_TO_NUMBER` — a fixed env variable, not the user's actual phone. Multi-user SMS delivery is not implemented.

---

## 🔵 Minor: InboxPage and ManagementPage are Stubs

- `frontend/src/pages/InboxPage.tsx` (228 bytes) — not functional
- `frontend/src/pages/ManagementPage.tsx` (197 bytes) — not functional

Routes `/inbox` and `/management` navigate to these pages but they render nothing useful.

---

## 🔵 Minor: Date Extraction is Regex-Based Only

**File**: `backend/src/service/dateExtractor.service.js`  
Pattern: `/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/`  
Only matches `DD/MM/YYYY`, `DD-MM-YYYY` etc. Will miss:
- Written dates: "January 15th", "Jan 15 2025"
- ISO dates like "2025-01-15" (pattern expects D/M/Y order, not Y-M-D)
- US format ambiguity (MM/DD vs DD/MM)

---

## Architectural Constraints

1. **Single OAuth identity**: Only Google accounts are supported. No email/password auth path exists.
2. **Single-tenant SMS**: SMS alerts are sent to a fixed test number, not per-user.
3. **No horizontal scaling**: ChromaDB is file-based local persistence — cannot be shared across multiple Python service instances.
4. **No auth on gRPC**: The gRPC connection between Node.js and Python uses `createInsecure()` — no TLS, no service-to-service auth.
5. **Shared MongoDB**: Both Node.js backend and Python service connect directly to the same MongoDB instance — no API layer between them.
6. **Session scoping in ask route**: Session messages are scoped to `{ _id, userEmail }` — correct and important, do not remove the `userEmail` filter.
