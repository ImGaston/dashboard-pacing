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

## 2026-08-04 — Mini-course extracted to standalone `course-rm` repo; Firebase removed here
**Decision**: Moved the entire mini-course (viewer, `/admin` CMS, Firestore layer, seed scripts, `public/course` assets) to `/Users/gaston/Programacion/course-rm`. This repo keeps only Pacing Tool, Revenue Tracker, and PMS Connector. Firebase (`lib/firebase.ts`, `firebase` dep, `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_ADMIN_PASSWORD`) removed — the course was its only consumer.
**Why**: Independent deploy/domain for the course; keep the hub lean.
**Consequences**: Course data untouched in the shared Firebase project (`course-rm` points at it). `ui/{dialog,progress,scroll-area}.tsx` and `react-markdown`/`remark-gfm`/`dotenv`/`tsx` also removed as course-only. The 2026-03 "Course content in Firestore" decision now lives on in `course-rm`.

## Earlier (from the Vite era, still true)
- Two chart libraries on purpose: Chart.js for simple charts, Recharts for composed/interactive ones.
- Custom CSV parser instead of papaparse (papaparse remains an unused dependency).
- STLY comparison logic is the core business invariant (see conventions.md).

## 2026-08-04 — Auth gates moved to server-validated httpOnly cookies + middleware
**Decision**: `/api/auth/login` validates the password server-side and sets a 1-year httpOnly cookie (`revfactor_auth` / `revfactor_admin_auth`); root `middleware.ts` guards `/dashboard`, `/admin/course` and bounces authed users off `/login`, `/admin`. Client guards (`AuthGuard`/`AdminGuard`) and localStorage tokens were removed; `/api/auth/logout` clears the cookie.
**Why**: localStorage tokens were evicted by Safari ITP after 7 days of inactivity, forcing password re-entry. Server-set cookies persist for a year. Bonus: passwords no longer ship in the client bundle.
**Consequences**: Cookie value is a static sentinel (forgeable) — same threat model as before, still a soft gate. Env vars keep their `NEXT_PUBLIC_` names for Vercel compat, but the route also reads `EVENT_PASSWORD` if defined; renaming it would fully remove it from the bundle. (Same-day update: the admin scope — `revfactor_admin_auth`, `/admin*` middleware rules — was removed when the mini-course moved to `course-rm`; only the event gate remains here.)
