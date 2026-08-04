# Project Map

Last verified: 2026-08-04. If structure drifts, update this file.

## Stack

- **Next.js 14** (App Router, `app/` directory) + **React 18** + **TypeScript 5.7** (`strict: true`)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — theme in `app/globals.css` using `@theme`
- **Chart.js** (`react-chartjs-2`) and **Recharts** — two charting libraries coexist intentionally
- **Radix UI** primitives wrapped shadcn/ui-style in `app/components/ui/`
- **date-fns**, **react-dropzone**, **lucide-react**
- `cn()` utility (clsx + tailwind-merge) in `lib/utils.ts`
- Declared but not (fully) wired: `papaparse` (custom parser used instead), `html2canvas`/`jspdf` (PDF export), `framer-motion`
- Package manager: **npm**. Deploy: **Vercel**.

## Folder structure

```
app/
├── layout.tsx               # Root layout: fonts, Umami analytics script, Toaster
├── page.tsx                 # / → redirects to /login
├── globals.css              # Tailwind v4 @theme: colors, fonts
├── login/page.tsx           # Event password gate → POST /api/auth/login → cookie → /dashboard
├── dashboard/page.tsx       # Main app: Tabs = PMS Connector | Pacing Tool | Revenue Tracker
├── api/auth/                # login/logout: server-side password check, sets 1-year httpOnly cookie
├── api/pms/                 # Server-side proxy routes to PMS APIs (see integrations.md)
│   ├── validate/route.ts    # Credential validation for all providers
│   ├── hostaway/  hospitable/  guesty/  hostfully/  ownerrez/
│   └── {provider}/_lib/auth.ts   # OAuth token exchange (hostaway, guesty)
├── components/
│   ├── ui/                  # shadcn-style primitives (button, card, input, label, select, table, tabs, toast)
│   ├── modules/             # One folder/file per dashboard tab
│   │   ├── PMSConnector.tsx + pms-connector/   # ConnectScreen, PMSDashboard, pacing/reservations tables
│   │   ├── RevenueTracker.tsx + revenue-tracker/
│   │   └── ComingSoonAPI.tsx
│   ├── Navbar.tsx, UploadScreen.tsx, Dashboard.tsx, KPICard.tsx, ScheduleModal.tsx
│   └── *Chart.tsx, MonthlyTable.tsx, LeadTimeHistogram.tsx   # CSV-pacing dashboard charts
├── utils/                   # PMS normalizers ({guesty,hostaway,hospitable,hostfully,ownerrez}Normalizer.ts)
│   └── bookingPacingUtils.ts
lib/
└── utils.ts                 # cn()
utils/                       # (root-level) CSV pacing engine
├── csvParser.ts             # Custom CSV parser, detectPMS(), column mapping
├── dataProcessing.ts        # Core business logic: STLY filtering, KPIs, pacing
└── chartSetup.ts            # Chart.js global registration
types.ts                     # Pacing domain types (Reservation, KPIMetrics, PacingDataPoint, …)
middleware.ts                # Edge middleware: cookie-based route guards (/dashboard, /login)
public/                      # Logos, PMS provider images
```

Leftovers to ignore: `dist/` (old Vite build), stale Vite `README.md`.

Note: the mini-course module (viewer, admin CMS, Firestore layer, seed scripts, course assets) was extracted to the standalone `course-rm` repo in 2026-08. This repo no longer uses Firebase.

## Routes

| Route | Purpose | Guard |
|---|---|---|
| `/` | Redirect to `/login` | — |
| `/login` | Event password gate | middleware (bounces authed → `/dashboard`) |
| `/dashboard` | Main tabbed app | middleware (`revfactor_auth` cookie) |
| `/api/auth/*` | Password login/logout, sets/clears httpOnly cookies | none |
| `/api/pms/*` | PMS proxy endpoints (POST, user-supplied keys) | none (stateless) |

Route protection lives in root `middleware.ts` (edge middleware reading cookies). There are no client-side guards.

## Data models

- **Pacing domain**: `Reservation`, `MonthlyMetric`, `KPIMetrics`, `PacingDataPoint`, `LeadTimeBucket`, `ChannelMix` in root `types.ts`.

## Commands

```
npm run dev      # Next.js dev server
npm run build    # Production build (runs TS check)
npm run start    # Serve production build
npm run lint     # next lint
```

No test runner is configured (TBD).
