# Decisions

Append-only log of technical decisions. Format:

```
## YYYY-MM-DD — Title
**Decision**: what was decided
**Why**: rationale
**Consequences**: trade-offs, follow-ups
```

Dates below marked ~ are reconstructed from git history/code archaeology, not recorded at decision time.

## ~2026-02 — Migrate from Vite SPA to Next.js 14 App Router
**Decision**: Rebuild the original client-only Vite pacing dashboard as a Next.js app.
**Why**: Needed server-side API routes to proxy PMS APIs (CORS + keep user API keys off the browser network path), plus multiple routes (login, admin, dashboard).
**Consequences**: `dist/` and the Vite `README.md` are leftovers; the old `src/`-era docs were stale until 2026-08-04.

## ~2026-02 — Lightweight password gates instead of real auth
**Decision**: Access control via `NEXT_PUBLIC_EVENT_PASSWORD` / `NEXT_PUBLIC_ADMIN_PASSWORD` + localStorage tokens.
**Why**: App is distributed to event attendees; low-stakes gating was enough, no user accounts needed.
**Consequences**: Passwords are visible in the client bundle. Not suitable if per-user data or billing is ever added — would need Firebase Auth or similar.

## ~2026-03 — PMS integrations as stateless proxy routes with user-supplied keys
**Decision**: Users paste their own PMS credentials; `app/api/pms/*` routes proxy each call statelessly, normalizers run client-side.
**Why**: No backend storage/compliance burden for third-party credentials; each provider gets an isolated route + normalizer.
**Consequences**: OAuth token exchange (Hostaway, Guesty) repeats per request; keys live in client component state for the session.

## ~2026-03 — Course content in Firestore with in-app admin CMS
**Decision**: Mini-course modules/lessons stored in Firestore (`modules`, `lessons`), edited via `/admin/course`, seeded by `scripts/seed-course.ts`. Lesson content is Markdown rendered with react-markdown + remark-gfm.
**Why**: Non-developer editing of course content without redeploys.
**Consequences**: Depends on Firestore security rules configured in the Firebase console (not in repo).

## Earlier (from the Vite era, still true)
- Two chart libraries on purpose: Chart.js for simple charts, Recharts for composed/interactive ones.
- Custom CSV parser instead of papaparse (papaparse remains an unused dependency).
- STLY comparison logic is the core business invariant (see conventions.md).
