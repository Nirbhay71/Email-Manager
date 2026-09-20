---
okf_version: "1.0"
title: "Frontend Architecture"
description: "React frontend structure, routing, and component hierarchy"
---

# Frontend Architecture

**Defined in**: `frontend/`  
**Framework**: React 19, Vite 8, Tailwind CSS 4, TypeScript (pages), anime.js  
**Entry point**: `frontend/index.html` → `frontend/src/main.jsx` → `frontend/src/App.jsx`

## File Structure

```
frontend/src/
├── main.jsx              # React root mount, StrictMode wrapper
├── App.jsx               # Root component: auth state, client-side routing
├── App.css               # Minimal global override
├── index.css             # Design tokens, Tailwind base + custom utilities
├── pages/
│   ├── LoginPage.tsx     # Generated login UI (Snitch-generated, static)
│   ├── InboxPage.tsx     # Email inbox view (stub — 228 bytes)
│   ├── AIChatPage.tsx    # Full AI chat interface (26 KB)
│   └── ManagementPage.tsx # Category management (stub — 197 bytes)
├── utils/
│   └── api.ts            # Centralized fetch wrapper with auto-refresh
├── assets/
│   └── (images/icons)
└── imports/
    └── Html→Body/        # Snitch-generated component fragments (not standard)
```

## Custom Client-Side Routing

`App.jsx` implements routing without React Router:
- Listens to `window.popstate` events via `usePathname()` hook
- `navigate(path)` → `history.pushState`
- `replacePath(path)` → `history.replaceState`
- Route table:
  - `/` → `LoginRoute` (shows `LoginPage.tsx` with overlay Google button)
  - `/inbox` → `InboxPage`
  - `/ai-chat` → `AIChatPage`
  - `/management` → `ManagementPage`
  - `/dashboard?email=...` → caught on OAuth callback, redirected to `/inbox`

## Auth State Management

`App.jsx` manages authentication state in `useState`:
1. On load: checks URL params for OAuth callback (`?email=&name=&avatar=`)
2. Falls back to `localStorage.getItem('user')`
3. Validates with `GET /auth/me` (only when not freshly logged in)
4. On `ACCESS_EXPIRED` 401: `api.ts` silently POSTs `/auth/refresh` and retries

User object stored in `localStorage`:
```json
{ "email": "...", "name": "...", "avatar": "..." }
```

## API Client

**File**: `frontend/src/utils/api.ts`  
- Exports: `apiFetch(path, options)`, `BACKEND` (hardcoded `http://localhost:5000`)
- Always sets `credentials: 'include'` (sends httpOnly cookies cross-origin)
- Implements **refresh queue**: concurrent 401 responses wait for a single refresh call

## Key Pages

### AIChatPage.tsx (`frontend/src/pages/AIChatPage.tsx`)
- Fetches chat sessions from `GET /chat/sessions`
- Creates sessions via `POST /chat/sessions`
- Streams AI answers from `POST /ask` as SSE
- Fetches emails from `GET /emails/inbox`

### InboxPage.tsx (`frontend/src/pages/InboxPage.tsx`)
- Currently a stub (228 bytes); minimal implementation

### ManagementPage.tsx (`frontend/src/pages/ManagementPage.tsx`)
- Currently a stub (197 bytes); minimal implementation

## Build Configuration

**File**: `frontend/vite.config.js`
- Dev proxy: `/api/*` → `http://localhost:5000` (rewrites `/api` prefix)
- Path alias: `@` → `./src`
- `historyApiFallback: true` — serves `index.html` for all routes

## Dependencies (key)

| Package | Version | Purpose |
|---|---|---|
| react | ^19.2.7 | Core UI |
| react-dom | ^19.2.7 | DOM renderer |
| tailwindcss | ^4.3.3 | Utility CSS |
| animejs | ^4.5.0 | Animations |
| react-icons | ^5.7.0 | Icon library |
| @vitejs/plugin-react | ^6.0.3 | Vite React plugin |
