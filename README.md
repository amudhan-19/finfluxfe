# FinFlux Frontend

Single Vite + React + TypeScript SPA for the FinFlux module. Role-based routing
and layouts for **Analyst**, **Supervisor**, **Director** and **Admin** all live
in this one codebase. UI design tokens preserved from the original mockup
(`tick-and-tie-flux-analysis_59.html` + `t-flux-admin_Final_2.html`).

## Setup

```bash
npm install
cp .env.example .env   # only needed if backend is on a different host

npm run dev            # http://localhost:5173
npm run typecheck      # tsc --noEmit
npm run build          # tsc -b && vite build → dist/
```

The dev server proxies `/api` and `/uploads` to `http://localhost:8000`, so the
backend can run on the same machine without CORS friction.

## How it works

- Login at `/login` calls `POST /api/auth/login`. The access token (15 min) is
  kept in memory; a 7-day refresh token lives in an httpOnly cookie.
- Once `/auth/me` resolves, the user is redirected to `/{role}/...`:
  - `analyst` → `/analyst/dashboard`
  - `supervisor` → `/supervisor/dashboard`
  - `director` → `/director/queue`
  - `admin` → `/admin/users`
- Route guards (`ProtectedRoute` + `RoleGuard`) enforce role-correct redirects;
  admin always passes through any RoleGuard.
- An axios interceptor silently calls `POST /api/auth/refresh` on the first 401,
  retries the original request, and bounces to `/login` if refresh fails.
- React Query owns server cache; Zustand (`useUiStore`) holds purely-UI state.

## Folder layout

```
src/
  main.tsx
  api/                  axios client + queryClient
  routes/               router.tsx + ProtectedRoute + RoleGuard
  layouts/              AnalystLayout · SupervisorLayout · DirectorLayout · AdminLayout
  pages/
    auth/               Login / AcceptInvite / Forgot / Reset
    analyst/            Dashboard · FluxReview · FinCalendar · Settings
    supervisor/         Dashboard · FluxReview · FinCalendar · FluxSettings
    director/           Queue
    admin/              Users · Config (RBAC + Branding + Entities)
                        · Integrations · Ontology · Audit · Support
  features/             one folder per domain — api.ts + hooks.ts
    auth · entities · flux · comments · signoffs · tasks · macro
    chat · profile · reminders · workflow · export
    admin-users · admin-rbac · admin-entities · admin-audit
    admin-branding · admin-integrations · admin-ontology
  components/
    layout/             TopBar · RoleNavTabs · EntityTreeNav
    dashboard/          DashboardView · EntityGrid
    flux/               FluxReviewView (table, sign-off, comments)
    calendar/           FinCalendarView
    shared/             ToastHost
  store/                useUiStore (UI-only state)
  constants/            theme.ts (X / WF / TAG_COLORS / captions)
  types/                models.ts (mirrors backend pydantic)
  utils/                rbac.ts · helpers.ts
```

## Roles & visibility

The frontend trusts what comes back from `/auth/me`. The backend is the source
of truth for what an account can see/do — every API call is re-checked there.
Frontend gating is for UX clarity only.

| Role       | Sees                              | Cannot                       |
|-----------|------------------------------------|------------------------------|
| Analyst    | `/analyst/*` only                  | Open `/admin`, `/supervisor`, `/director` |
| Supervisor | `/supervisor/*`                    | Open `/admin`                |
| Director   | `/director/*`, `/supervisor/*`     | Open `/admin`                |
| Admin      | Everything                         | —                            |

## Conventions

- Inline `style={{...}}` matches the original mockup palette (see
  `constants/theme.ts`). Add new tokens there, not as magic numbers.
- API calls live in `features/<domain>/api.ts`. Hooks (`features/<domain>/hooks.ts`)
  wrap them in React Query. Pages never call axios directly.
- Drop the `.tsx` rule-set: every new component file is TSX. JSX is no longer
  accepted in this project.
- Heavy pages are `lazy()`-loaded in `routes/router.tsx`.

## Bootstrap demo flow

After running the backend seed (`python -m scripts.seed`), all of these can sign
in with password `Demo@12345`:

| Email                | Role       |
|----------------------|------------|
| admin@example.com    | admin (uses `ADMIN_PASSWORD` from `.env`) |
| jane@example.com     | supervisor |
| mark@example.com     | supervisor |
| lisa@example.com     | director   |
| priya@example.com    | analyst    |
| raj@example.com      | analyst    |
| sara@example.com     | analyst    |
| david@example.com    | analyst    |
