# Security Notes

## Resolved: Unauthenticated API Access (Express layer)

**Status**: Fixed at the Express layer
**Impact was**: High (Unauthorized Data Access)

`/ask` and `/search/v2` used to trust a client-supplied `userEmail` in the
request body. Both now take `userEmail` from `req.user.email`, populated by
`requireAuth` after verifying the JWT in the `accessToken` cookie — a
client-supplied `userEmail` field is ignored.

The backing Python services (`search_feature_demo`, `python-service`) were
still reachable directly and unauthenticated, which reopened the same hole
one hop down — see "Resolved: Unauthenticated internal services" below.

## Resolved: Unauthenticated internal services

**Status**: Fixed
**Impact was**: High (Unauthorized Data Access, service-to-service)

The gRPC servers (`search_feature_demo/grpc_app/server.py`,
`python-service/server.py`) and the FastAPI search service
(`search_feature_demo/api/http_server.py`) had no auth of their own — the
Express layer verifying the user was irrelevant if someone could reach the
gRPC/HTTP ports directly and pass any `user_email`/`userEmail` they wanted.

Fixed by:
- Binding all three to `127.0.0.1` by default (`GRPC_BIND_HOST` /
  `HTTP_BIND_HOST` env vars) instead of `0.0.0.0`/`[::]`.
- Requiring a shared `SERVICE_TOKEN` on every call — a gRPC server
  interceptor on the Python side, `X-Service-Token` header on the FastAPI
  side, sent as metadata/header by the Node backend on every call. Fails
  closed (rejects everything) outside `ENVIRONMENT=development` if the
  token isn't configured.
- Restricting FastAPI CORS from `allow_origins=["*"]` (invalid combined with
  `allow_credentials=True` anyway) to an explicit origin allowlist.

See `SECRET_ROTATION_CHECKLIST.md` for generating and wiring up `SERVICE_TOKEN`.

## Other fixes in this pass

- Chat session `updateSessionStatus` no longer lets any logged-in user
  modify another user's session by ID (IDOR) — scoped to the authenticated
  user, with `status` validated against an allowlist.
- `POST /webhook/gmail` previously had zero verification; it now requires a
  valid Google-signed OIDC token matching `PUBSUB_AUDIENCE` and
  `PUBSUB_SERVICE_ACCOUNT_EMAIL`, and fails closed outside development.
- OAuth login now uses a signed `state` parameter (CSRF protection) and PKCE.
  The callback redirect no longer puts email/name/avatar in the URL query
  string — the frontend fetches identity from `GET /auth/me` instead.
- Google OAuth tokens are now encrypted at rest (AES-256-GCM); our own
  refresh tokens are stored as a SHA-256 hash, never in plaintext.
- Refresh-token reuse now revokes all of that user's sessions instead of
  just clearing the presenting client's cookies.
- Added rate limiting (`express-rate-limit`), `helmet`, a JSON body size
  cap, and length caps on `/ask` question and `/search/v2` query/limit/offset.
- `/ask` and the Python search service no longer echo raw exception
  messages back to clients.
- Removed the unauthenticated `/test-ai` dev panel and the dead
  `backend/public/index.html` (called a non-existent `/api`).
- Removed the `fs` and `instead` npm packages (unneeded, unexplained
  dependencies) and moved `nodemon` to `devDependencies`.

## Still open (not addressed in this pass)

- **Live secrets need rotation** — see `SECRET_ROTATION_CHECKLIST.md`.
  Nothing here can rotate your Google/Twilio/Gemini credentials for you.
- Email-triggered side effects (calendar events + SMS from any sender's
  email content) have no sanitization/length caps or user opt-in yet.
- No CSRF token (relies on `sameSite: lax`, which is a reasonable default
  but not a substitute if the deployment ever needs `sameSite: none`).
- Prompt injection: email content goes directly into Gemini/RAG prompts
  with no treatment as untrusted input.
- PII (query text, user emails) still appears in some log lines.
- `classifier-service/` is an incomplete/dead parallel effort — not
  security-critical, but worth removing or finishing.
- `npm audit` still reports a moderate transitive `uuid` advisory via
  `google-auth-library` → `gaxios` with no non-breaking fix available yet.
