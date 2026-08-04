# Sessions — rolling summary

Short rolling log so the next agent can pick up context fast.

**How to maintain**: after a significant session, prepend a 2–4 line entry (date, what changed, open threads). Keep at most ~10 entries — delete the oldest. This is a scratch log, not history (git has that). Never record secrets or personal data.

---

## 2026-08-04 — Mini-course migrated out to `course-rm`
- Extracted the whole mini-course module (+ admin CMS, Firestore libs, seed scripts, `public/course`) to the new standalone repo `/Users/gaston/Programacion/course-rm` (course at `/course`, CMS at `/admin/course`, same Firebase project, no event-password gate there).
- Removed Firebase and course-only deps/ui primitives from this repo; dashboard now has 3 tabs.
- Open threads: remove `NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_ADMIN_PASSWORD` from `.env.local`/Vercel (manual); create Vercel project for `course-rm`.

## 2026-08-04 — Agent memory system initialized
- Created `AGENTS.md` (routing file), pointed `CLAUDE.md` at it via `@AGENTS.md`, and wrote `docs/agent/` (project-map, conventions, integrations, performance, decisions, sessions).
- Repo inspection revealed the old `CLAUDE.md` and `README.md` described the retired Vite SPA; docs now reflect the real stack: Next.js 14 App Router + Firestore + PMS proxy routes (Hostaway, Hospitable, Guesty, Hostfully, OwnerRez) + Umami.
- Open threads: `README.md` still stale Vite template; no test suite; Firestore security rules undocumented (TBD); unused deps (papaparse, framer-motion, html2canvas/jspdf) still declared.
