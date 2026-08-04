# AGENTS.md — RevFactor Revenue Hub

Routing file for coding agents (Codex, Claude Code, etc.). Keep this short — durable knowledge lives in `docs/agent/`.

## Project Snapshot

- **What**: RevFactor — revenue analytics hub for short-term rental (STR) property managers. Modules: CSV pacing dashboard, revenue tracker, and live PMS connector (5 providers). (The mini-course was extracted to the standalone `course-rm` repo, 2026-08.)
- **Stack**: Next.js 14 (App Router) · React 18 · TypeScript 5.7 (strict) · Tailwind CSS v4 · Chart.js + Recharts.
- **Package manager**: npm (`package-lock.json`).
- **Deploy**: Vercel (`vercel.json`).
- **Commands**: `npm run dev` · `npm run build` · `npm run lint`. No test suite exists (TBD).
- ⚠️ `README.md` is a stale Vite template — ignore it. This file + `docs/agent/` are the source of truth for agents.

## Memory Map

Read only what the task needs:

| Task | Read |
|---|---|
| Any code change (orient first) | `docs/agent/project-map.md` |
| Writing components, styling, business logic | `docs/agent/conventions.md` |
| PMS APIs, Umami, auth | `docs/agent/integrations.md` |
| Perf-sensitive work (charts, CSV parsing, API routes) | `docs/agent/performance.md` |
| "Why is it like this?" / before proposing rewrites | `docs/agent/decisions.md` |
| Continuing recent work | `docs/agent/sessions.md` |

## Critical Rules

- Never commit secrets. `.env.local` is gitignored and holds the gate password — never inline its values in code or docs.
- PMS API keys are user-supplied at runtime and flow through `app/api/pms/*` proxy routes. Never log them or persist them server-side.
- All `NEXT_PUBLIC_*` vars are exposed to the browser — do not put real secrets there beyond what already exists.
- Use the design-system tokens (`bone`, `cedar`, `moss`, `walnut`, `tobacco`, `onyx` — defined in `app/globals.css`), not arbitrary hex values.
- Path alias is `@/*` from repo root (`tsconfig.json`).
- Don't remove `data-umami-event` attributes when editing components — they power analytics.

## Durable Memory Updates

When work reveals something durable (a new integration, a gotcha, a decision, a changed convention), update the matching file in `docs/agent/` in the same PR/commit. Append decisions to `decisions.md` with a date. After a significant session, add a 2–4 line entry to `sessions.md` (keep it a short rolling log — prune old entries). Never store secrets, tokens, or personal data in these docs.

## Verification Defaults

- Docs-only change: nothing to run.
- Code change: `npm run build` (includes the TypeScript check) and `npm run lint`.
- No automated tests exist — verify UI changes manually with `npm run dev`.
