---
okf_version: "1.0"
title: "Frontend-to-Backend Data Flows"
description: "How frontend pages call backend APIs and what data they exchange"
---

# Frontend-to-Backend Data Flows

**API client**: `frontend/src/utils/api.ts → apiFetch()`  
Always sends `credentials: 'include'` (httpOnly cookie forwarding).

---

## App Initialization Flow

```
App.jsx → mount
  ├── [OAuth callback] parseCallbackUser() reads ?email=&name=&avatar= from URL
  │     → localStorage.set('user', {...})
  │     → replacePath('/inbox')
  │
  └── [Returning user] localStorage.get('user')
        → apiFetch('GET /auth/me')    [validates session is still alive]
        → If 401: clear localStorage → redirect to '/'
        → If ok: refresh user.email + user.avatar
        → replacePath('/inbox')
```

## Login Flow

```
LoginRoute (App.jsx)
  → User clicks Google button (invisible overlay on LoginPage.tsx)
  → window.location.href = `${BACKEND}/auth/google`    [full page redirect]
  → [Authentication flow — see authentication-flow.md]
  → Backend redirects to /dashboard?email=&name=&avatar=
  → App.jsx parseCallbackUser() picks up params
  → user state set → navigate to /inbox
```

## Inbox Data Flow

```
InboxPage.tsx [stub — implementation not yet complete]
  → likely: apiFetch('GET /emails/inbox?limit=20')
  ← { emails: [...], total: N }
```

## AI Chat Page Flows (`AIChatPage.tsx`)

### Session Loading
```
AIChatPage mount
  → apiFetch('GET /chat/sessions')
  ← Sessions[] sorted by updatedAt desc
```

### Session Creation
```
User starts new chat
  → apiFetch('POST /chat/sessions', { body: { title: "New Conversation" } })
  ← New ChatSession document
```

### Streaming AI Q&A
```
User submits question
  → fetch('/ask', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ question, sessionId })
    })
  → Response: text/event-stream
  → Frontend reads chunks via ReadableStream / EventSource
  ← data: { text_delta: "Hello" }
  ← data: { text_delta: " world" }
  ← data: { is_final: true, sources: [{ message_id, subject, score }] }
  → Append { role: 'user', content } + { role: 'ai', content } to session messages in UI
```

### Calendar Events
```
AIChatPage / Calendar section
  → apiFetch('GET /calendar/events?timeMin=ISO&timeMax=ISO')
  ← { email, events[], hasEvents, total }
```

---

## Token Refresh Flow (transparent)

```
apiFetch(path)
  → fetch → 401 { code: "ACCESS_EXPIRED" }
  → [if isRefreshing] queue this request
  → POST /auth/refresh (credentials: include, uses refreshToken cookie)
  → OK → processQueue → retry all queued requests
  → [if refresh fails] localStorage.removeItem('user') → redirect '/'
```
