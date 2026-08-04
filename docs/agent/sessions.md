# Sessions — rolling summary

Short rolling log so the next agent can pick up context fast.

**How to maintain**: after a significant session, prepend a 2–4 line entry (date, what changed, open threads). Keep at most ~10 entries — delete the oldest. This is a scratch log, not history (git has that). Never record secrets or personal data.

---

## 2026-08-04 — Persistent password sessions (cookies + middleware)
- Replaced localStorage auth gates with server-validated login (`app/api/auth/login`, `logout`) setting 1-year httpOnly cookies; new root `middleware.ts` guards `/dashboard` and `/admin/course`. Deleted `AuthGuard`/`AdminGuard`.
- Verified end-to-end with `npm run build` + curl against `next start` (redirects, 401 on wrong password, Set-Cookie, logout).
- Note: `npm run lint` is unconfigured (interactive ESLint setup prompt) — open thread.

## 2026-08-04 — Agent memory system initialized
- Created `AGENTS.md` (routing file), pointed `CLAUDE.md` at it via `@AGENTS.md`, and wrote `docs/agent/` (project-map, conventions, integrations, performance, decisions, sessions).
- Repo inspection revealed the old `CLAUDE.md` and `README.md` described the retired Vite SPA; docs now reflect the real stack: Next.js 14 App Router + Firestore + PMS proxy routes (Hostaway, Hospitable, Guesty, Hostfully, OwnerRez) + Umami.
- Open threads: `README.md` still stale Vite template; no test suite; Firestore security rules undocumented (TBD); unused deps (papaparse, framer-motion, html2canvas/jspdf) still declared.
