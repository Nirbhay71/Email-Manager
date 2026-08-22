---
okf_version: "1.0"
title: "Authentication Flow"
description: "Step-by-step OAuth + JWT flow with frontend and backend interactions"
---

# Authentication Flow

## Complete OAuth + JWT Issuance Flow

```
Step 1: User clicks "Continue with Google"
  frontend/src/App.jsx → LoginRoute → onClick
  → window.location.href = 'http://localhost:5000/auth/google'

Step 2: Backend redirects to Google
  backend/src/routes/auth.routes.js GET /auth/google
  → auth.controllers.js → googleLogin()
  → config/google.config.js → getOAuthClient()
  → oAuth2Client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: [...] })
  → HTTP 302 → accounts.google.com/o/oauth2/auth?...

Step 3: User grants permission on Google
  Google redirects back → GET /auth/google/callback?code=AUTH_CODE

Step 4: Backend exchanges code + upserts user
  auth.controllers.js → googleCallback()
  → oAuth2Client.getToken(code) → { access_token, refresh_token, ... }
  → google.oauth2.userinfo.get() → { email, name, picture }
  → User.findOne({ email }) || new User({ email, avtar, tokens })
  → user.tokens = google_tokens   (for Gmail/Calendar API calls)
  → gmail.service.js → startWatch(tokens)   (Pub/Sub subscription)
  → user.historyId = watchResult.historyId

Step 5: Backend issues own JWT tokens
  utils/token.utils.js → signAccessToken({ email, sub: user._id })  → JWT 15m
  utils/token.utils.js → generateRefreshToken()                      → 128-char hex
  → user.refreshTokens.push({ token, expiresAt: now+7d })
  → user.save()

Step 6: Set cookies & redirect
  token.utils.js → setAuthCookies(res, accessToken, refreshToken)
  → res.cookie('accessToken', ..., { httpOnly, sameSite:'lax', maxAge: 15m })
  → res.cookie('refreshToken', ..., { httpOnly, sameSite:'lax', maxAge: 7d })
  → res.redirect(`${FRONTEND_URL}/dashboard?email=...&name=...&avatar=...`)

Step 7: Frontend receives redirect
  frontend/src/App.jsx → parseCallbackUser()
  → reads ?email, ?name, ?avatar from URL
  → localStorage.setItem('user', JSON.stringify({ email, name, avatar }))
  → sessionStorage.setItem('just_logged_in', '1')
  → setUser(callbackUser)
  → replacePath('/inbox')    (cleans URL, keeps user info in localStorage)
```

## Token Refresh Sequence

```
Any apiFetch() → backend returns 401 { code: "ACCESS_EXPIRED" }
  ↓
api.ts: isRefreshing = true
  → POST /auth/refresh (cookies: include)
  → auth.routes.js → refreshTokensHandler()
  → User.findOne({ 'refreshTokens.token': incoming, expiresAt > now })
  → Prune used token (rotation)
  → signAccessToken() + generateRefreshToken()
  → user.refreshTokens.push({ newToken, expiresAt: now+7d })
  → user.save()
  → setAuthCookies(res, newAccess, newRefresh)
  ← 200 { ok: true }
  → api.ts: retry original request
  → processQueue() — all queued retries resume
```

## Logout Sequence

```
User clicks Logout
  → apiFetch('POST /auth/logout')
  → auth.controllers.js → logout()
  → reads req.cookies.refreshToken
  → User.findOneAndUpdate($pull refreshTokens where token === incoming)
  → token.utils.js → clearAuthCookies(res)
  ← 200 { ok: true, message: "Logged out successfully" }
  → frontend: localStorage.removeItem('user')
  → navigate('/')
```

## Session Validation on App Load

```
App.jsx init (returning user, not fresh OAuth callback)
  → apiFetch('GET /auth/me')   [sends accessToken cookie automatically]
  → auth.middleware.js → requireAuth()
  → jwt.verify(accessToken, JWT_ACCESS_SECRET) → { email, sub }
  → req.user = { email, sub }
  → auth.controllers.js → getMe()
  → User.findOne({ email }).select('email avtar')
  ← 200 { email, avatar }
  → update localStorage.user with fresh data
```
