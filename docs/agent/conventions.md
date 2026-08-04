# Conventions

## Code style

- TypeScript `strict: true`; avoid `any` (some legacy `any` exists — don't add more).
- Path alias `@/*` maps to repo root: `import { cn } from "@/lib/utils"`, `import type { Reservation } from "@/types"`.
- Client components declare `"use client"` at top; API routes and `app/page.tsx` are server-side.
- 4-space indentation in most `app/` files; match whatever the file you're editing uses.

## Frontend patterns

- **Design system** (tokens in `app/globals.css` via `@theme`):
  - Colors: `bone` (#F6F5F3 bg, + `-light/-muted/-dark`), `cedar` (#13342D primary, + `-light`), `moss` (#5D6D59 secondary, + `-light`), `walnut` (#76574C / prev-year in charts, + `-light`), `tobacco` (#3F261F body text), `onyx` (#161910 headings).
  - Fonts: headings `Cormorant Garamond` (`--font-serif`), body sans.
  - Use token classes (`bg-cedar`, `text-moss`), never raw hex in components.
- White card containers: `bg-white p-6 rounded-xl shadow-sm border border-bone`.
- Uppercase labels: `text-xs font-bold text-moss uppercase tracking-widest`.
- Combine classes with `cn()` from `lib/utils.ts`.
- UI primitives live in `app/components/ui/` (shadcn/ui pattern over Radix). Reuse them; don't hand-roll dialogs/tabs/toasts.
- Toasts via `use-toast.ts` + `<Toaster />` in root layout.
- Two chart libraries by design: Chart.js for simple charts (Pacing line, Channel doughnut, LeadTime bar — globally registered in `utils/chartSetup.ts`), Recharts for composed/interactive ones (PacingSnapshot, BookingCurve).
- No router state: dashboard tabs and upload/dashboard view switching use `useState`.
- Analytics: interactive elements carry `data-umami-event` (+ `data-umami-event-*` params). Preserve these when refactoring; add them to new significant CTAs.

## Backend patterns (API routes)

- All external PMS calls go through `app/api/pms/{provider}/{resource}/route.ts` — never call PMS APIs from the browser (CORS + key exposure).
- Routes are stateless POST handlers: receive credentials in the request body, call the provider, return normalized-ish JSON. Provider OAuth helpers live in `app/api/pms/{provider}/_lib/auth.ts`.
- Response shape on failure: `NextResponse.json({ valid|error ... }, { status })` — keep error messages user-readable (they surface in ConnectScreen).
- Provider payloads are normalized client-side in `app/utils/{provider}Normalizer.ts` into the shared domain types.

## Business logic

- **STLY (Same Time Last Year)** in `utils/dataProcessing.ts`: current year = check-in in current year AND booked on/before comparison date; previous year = check-in in previous year AND booked on/before (comparison date − 1 year). Don't break this invariant.
- All date math uses `date-fns`.
- CSV parsing is the custom parser in `utils/csvParser.ts` (papaparse is installed but unused).

## Error handling

- Legacy CSV-upload flow uses `alert()` for parse failures; no error boundaries exist. Newer modules use toasts — prefer toasts for new code.
- API routes wrap handlers in try/catch and return structured JSON errors, never throw raw.

## Testing

- No test suite. Verification = `npm run build` (TS check) + `npm run lint` + manual check in `npm run dev`. If a test framework is added, document it here.

## Security & secrets

- `.env.local` (gitignored): `NEXT_PUBLIC_EVENT_PASSWORD`. Browser-exposed by design — the password gate is lightweight access control, not real auth.
- Auth model: `localStorage` token (`revfactor_auth`) checked by `AuthGuard`. Know its limits; don't present it as secure.
- User-supplied PMS API keys: kept in client state, sent per-request to `/api/pms/*`. Never log them (client or server), never persist them, never echo them in error messages.
