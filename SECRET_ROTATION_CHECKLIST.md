# Secret Rotation Checklist

This is a manual checklist — none of these steps can be done by an
assistant on your behalf; they require access to your Google Cloud,
Twilio, and Gemini accounts, and to wherever `backend/src/.env`,
`classifier-service/.env`, `search_feature_demo/.env`, and
`python-service/.env` actually live.

Do these in order. Nothing in the app will work with placeholder values,
so budget time to update `.env` files and restart all services once you're done.

## 1. Rotate every live secret

For each of these, generate/reissue a new value in the provider's console,
update it everywhere it's used, then revoke the old one:

- [ ] **Google OAuth client secret** (`GOOGLE_CLIENT_SECRET`) — Google Cloud Console → APIs & Services → Credentials → your OAuth client → reset secret.
- [ ] **Twilio auth token** (`TWILIO_AUTH_TOKEN`) — Twilio Console → Account → API keys & tokens → regenerate.
- [ ] **MongoDB URI credentials** (`MONGO_URI`) — if it embeds a username/password, rotate the DB user's password.
- [ ] **Gemini API key** (`GEMINI_API_KEY`) — Google AI Studio / Cloud Console → regenerate key, delete the old one.
- [ ] Remove the commented-out Twilio credentials sitting in `backend/src/.env` — a commented secret is still a secret on disk.

## 2. Regenerate `JWT_ACCESS_SECRET`

The current value starts with `ACa3` — the same prefix as `TWILIO_ACCOUNT_SID`.
If it *is* that SID, it's public-ish (visible in the Twilio console to anyone
with account access) and guessable, which means anyone who has it can forge
an access token for any email address.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Put the output in `JWT_ACCESS_SECRET`. This immediately invalidates every
existing access token — all users will need to log in again.

## 3. Generate `TOKEN_ENCRYPTION_KEY`

New in this round of fixes: Google OAuth tokens are now encrypted at rest
(AES-256-GCM) rather than stored as plaintext in MongoDB. This requires a
32-byte key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the output in `backend/src/.env` as `TOKEN_ENCRYPTION_KEY`. **Do this before
starting the backend** — without it, `user.tokensPlain` throws instead of
silently storing plaintext.

⚠️ If you have existing users in the database, their `tokens` field is still
in the old plaintext shape and won't decrypt with the new code path. Either:
- wipe existing user records and have them re-auth (simplest for a dev/demo DB), or
- write a one-off migration that reads the old plaintext `tokens.access_token` /
  `tokens.refresh_token` fields and re-saves via `user.tokensPlain = {...}`.

## 4. Generate `SERVICE_TOKEN`

New in this round: the Python gRPC and FastAPI services now require a shared
token on every call from the Node backend (previously anyone who could reach
those ports could query any user's data).

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the **same value** in all three places:
- `backend/src/.env` → `SERVICE_TOKEN`
- `search_feature_demo/.env` → `SERVICE_TOKEN`
- `python-service/.env` → `SERVICE_TOKEN`

Also set `ENVIRONMENT=development` in the two Python `.env` files while
you're testing locally, or the service token check fails closed (rejects
all requests) once you unset it. Set `ENVIRONMENT=production` (or anything
other than `development`) before deploying anywhere the port might be
reachable by something other than your own backend.

## 5. Set up Pub/Sub webhook verification

New in this round: `POST /webhook/gmail` used to have **no verification at
all**. It now requires:
- `PUBSUB_AUDIENCE` — the audience your Pub/Sub push subscription's OIDC
  token is configured with (typically your webhook URL).
- `PUBSUB_SERVICE_ACCOUNT_EMAIL` — the service account your push
  subscription authenticates as.

Both must be set in `backend/src/.env` outside `NODE_ENV=development`, or the
webhook returns 503 and Gmail push notifications stop working. See
[Google's Pub/Sub push authentication docs](https://cloud.google.com/pubsub/docs/push)
for how to configure the subscription itself to send a signed OIDC token.

## 6. Move secrets out of `.env` files long-term

`.env` files are fine for local dev but shouldn't be how this runs in any
shared or production environment:
- Use your cloud provider's secret manager (Google Secret Manager, AWS
  Secrets Manager, etc.) or a `.env`-injecting deploy step that never writes
  secrets to disk on the host.
- Confirm `backend/`, `search_feature_demo/`, `python-service/`, and
  `classifier-service/` `.env` files are `.gitignore`d (they are) — but
  since none of these directories were `git init`'d independently, also
  double check none of these values were ever committed by accident:
  `git log --all -p -- '*.env' '**/.env'` from the repo root, and search
  GitHub's secret scanning alerts on the repo if it's ever been pushed.

## 7. After rotating

- [ ] Restart `backend`, `search_feature_demo`, and `python-service`.
- [ ] Confirm `/auth/google` → callback → `/auth/me` still logs a fresh user in end-to-end.
- [ ] Confirm `/ask` and `/search/v2` still return results (they now require `SERVICE_TOKEN` to reach the Python services).
- [ ] Delete/expire the old Twilio, Google, and Gemini credentials in their respective consoles — rotation isn't done until the old value stops working.
