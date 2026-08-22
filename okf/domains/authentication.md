---
okf_version: "1.0"
title: "Authentication Domain"
description: "Google OAuth 2.0 flow, JWT token strategy, middleware, and session management"
---

# Authentication Domain

## Strategy

**Google OAuth 2.0** is the sole authentication mechanism. No username/password login exists.  
Post-OAuth, the backend issues its own **JWT access token** + **opaque refresh token** pair, delivered as **httpOnly cookies**.

## Flow Summary

```
Browser → GET /auth/google
  → backend/src/routes/auth.routes.js
  → backend/src/controllers/auth.controllers.js → googleLogin()
  → Redirects to Google authorization URL

Google → GET /auth/google/callback?code=...
  → googleCallback()
  → Exchange code for Google tokens (googleapis)
  → Get user profile (oauth2.userinfo.get)
  → Upsert User in MongoDB
  → Start Gmail Pub/Sub watch (startWatch)
  → signAccessToken({ email, sub })       → 15-minute JWT
  → generateRefreshToken()                → 128-char hex (crypto.randomBytes)
  → setAuthCookies(res, access, refresh)  → httpOnly cookies
  → Redirect to frontend /dashboard?email=&name=&avatar=
```

## Token Details

| Token | Type | Storage | Expiry | Rotation |
|---|---|---|---|---|
| `accessToken` | JWT (signed, `JWT_ACCESS_SECRET`) | httpOnly cookie | 15 minutes | On every refresh |
| `refreshToken` | Opaque (crypto.randomBytes(64)) | httpOnly cookie + MongoDB `refreshTokens[]` | 7 days | On every use |

**Defined in**: `backend/src/utils/token.utils.js`

## Cookie Options

```javascript
httpOnly: true                               // JS cannot read
sameSite: 'lax'                              // CSRF protection
secure: process.env.NODE_ENV === 'production' // HTTPS only in prod
maxAge: 15 * 60 * 1000  // accessToken
maxAge: 7 * 24 * 60 * 60 * 1000 // refreshToken
```

## Auth Middleware

**File**: `backend/src/middleware/auth.middleware.js`  
**Export**: `requireAuth`

```
cookie.accessToken
  → jwt.verify(token, JWT_ACCESS_SECRET)
  → req.user = { email, sub }
  → next()

On TokenExpiredError → 401 { error: "Access token expired", code: "ACCESS_EXPIRED" }
On invalid token    → 401 { error: "Invalid token" }
On missing token    → 401 { error: "Unauthorized — please log in" }
```

## Token Refresh

**Route**: `POST /auth/refresh`  
**Controller**: `refreshTokensHandler()` in `auth.controllers.js`

```
cookie.refreshToken
  → Find User where refreshTokens.token === incoming AND expiresAt > now
  → Remove used token (rotation)
  → signAccessToken() + generateRefreshToken()
  → Push new refreshToken to user.refreshTokens[]
  → setAuthCookies(res, newAccess, newRefresh)
  → 200 { ok: true }

If token not found → clearAuthCookies() → 401
```

## Frontend Token Refresh

**File**: `frontend/src/utils/api.ts`  
- All API calls use `credentials: 'include'`
- On 401 with `code: 'ACCESS_EXPIRED'`: silently calls `POST /auth/refresh`, retries original request
- Concurrent refreshes are queued (single refresh at a time via `isRefreshing` flag)
- If refresh fails: clears localStorage, redirects to `/`

## Logout

**Route**: `POST /auth/logout` (protected)  
**Controller**: `logout()`

```
Reads refreshToken cookie
→ User.findOneAndUpdate($pull { refreshTokens: { token } })
→ clearAuthCookies()
→ 200 { ok: true }
```
Only invalidates the current device's token (not all sessions).

## Files Involved

| File | Role |
|---|---|
| `backend/src/routes/auth.routes.js` | Route definitions |
| `backend/src/controllers/auth.controllers.js` | Handler logic |
| `backend/src/middleware/auth.middleware.js` | JWT verification |
| `backend/src/utils/token.utils.js` | Token sign/generate/set/clear |
| `backend/src/config/google.config.js` | OAuth2Client factory |
| `backend/src/models/user.model.js` | User + refreshTokens storage |
| `frontend/src/utils/api.ts` | Auto-refresh on client |
| `frontend/src/App.jsx` | Session init, OAuth callback handling |

## OAuth Scopes Requested

```javascript
"https://www.googleapis.com/auth/gmail.readonly"
"https://www.googleapis.com/auth/calendar.events"
"https://www.googleapis.com/auth/userinfo.email"
```
