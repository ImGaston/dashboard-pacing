# Integrations

## PMS provider APIs (proxied via `app/api/pms/*`)

User supplies credentials in the PMS Connector UI (`ConnectScreen.tsx`); server routes proxy the calls. `POST /api/pms/validate` checks credentials for all providers.

| Provider | Auth | Routes | Normalizer |
|---|---|---|---|
| Hostaway | OAuth client-credentials (`accountId` + `apiKey` → token, `_lib/auth.ts`) | listings, reservations, financials | `app/utils/hostawayNormalizer.ts` |
| Hospitable | Bearer token (Personal Access Token) | properties, reservations, financials | `hospitableNormalizer.ts` |
| Guesty | OAuth (`_lib/auth.ts`) | listings, reservations | `guestyNormalizer.ts` |
| Hostfully | API key | agencies, listings, reservations, orders | `hostfullyNormalizer.ts` |
| OwnerRez | API key | properties, reservations | `ownerrezNormalizer.ts` |

Notes:
- Hostfully and Guesty integrations were labeled **beta** in the UI (commit `d3c10cb`).
- Keys are never persisted server-side; treat every route as stateless.

## Firebase (Firestore)

- Init in `lib/firebase.ts` from `NEXT_PUBLIC_FIREBASE_*` env vars; exports `db`.
- Collections: `modules`, `lessons` (course CMS — `lib/firestore-course.ts`), `subscribers` (mini-course email gate — `lib/firestore-subscribers.ts`).
- Only Firestore is used (no Firebase Auth, Storage, or Functions).
- Seeding: `npx tsx scripts/seed-course.ts` (loads `.env.local` via dotenv).
- Firestore security rules are managed in the Firebase console, not in this repo (TBD: document current rules).

## Analytics — Umami

- Self-hosted Umami loaded in `app/layout.tsx` (`umami-rgc.up.railway.app`, deferred script with a public website id).
- Events are declarative: `data-umami-event` (+ `data-umami-event-*` attributes) on tabs, CTAs, and module actions. Keep them when refactoring.

## Auth (internal, not external)

- No external auth provider. Two localStorage password gates: event password (`/login` → `/dashboard`) and admin password (`/admin` → `/admin/course`). Passwords come from `NEXT_PUBLIC_EVENT_PASSWORD` / `NEXT_PUBLIC_ADMIN_PASSWORD`.

## Hosting

- Vercel (framework preset `nextjs` via `vercel.json`). Env vars must be configured in the Vercel project.

## Not present

- No webhooks, no payment providers, no email-sending service (subscriber emails are only stored in Firestore), no other cloud services.
