# TCMS Frontend (Phase P1 — Foundation)

React 18 + Vite + TypeScript client for the P1 backend (`../server`). Independent project —
no shared package, talks to the backend only over its REST API (`VITE_API_BASE_URL`).

## Setup

```bash
cd client
npm install
cp .env.example .env.local
# Edit .env.local if the backend isn't at the default http://localhost:4000/api/v1
npm run dev
```

Requires the backend running (`../server`, see its README) and seeded (`npm run seed` in
`server/`) — sign in with the seeded admin account.

## What's here

- Design tokens (`src/styles/tokens.css`) and five primitives (`src/design-system`):
  Button, Field, Select, Toast, ConfirmDialog.
- Auth: login, forgot/reset password, forced first-login password change — access token
  in memory only (never localStorage), refresh token is the backend's HttpOnly cookie.
- Permission-driven route guards (`src/app/RouteGuard.tsx`) and nav (`src/app/AppShell.tsx`)
  built from the permission set `/auth/me` returns — the server's own `authorize()`
  middleware is still what actually enforces access.
- Master-data screens for machine types (with the thread-line-template editor) and thread
  varieties, built on TanStack Query against the backend's paginated list endpoints.

Not in this phase: styles/operations/the chain, the calculation engine, the estimating
workspace, dashboards beyond a role-labelled placeholder — those arrive with P2 onward.

## Scripts

| Command                | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the Vite dev server.               |
| `npm run build`        | Typecheck + production build to `dist/`. |
| `npm run typecheck`    | `tsc --noEmit`.                          |
| `npm run lint`         | ESLint (zero-warning).                   |
| `npm run format:check` | Prettier check.                          |
