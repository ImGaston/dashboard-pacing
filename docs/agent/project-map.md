# Project Map

Last verified: 2026-08-04. If structure drifts, update this file.

## Stack

- **Next.js 14** (App Router, `app/` directory) + **React 18** + **TypeScript 5.7** (`strict: true`)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — theme in `app/globals.css` using `@theme`
- **Firebase Firestore** (client SDK) — course content + email subscribers
- **Chart.js** (`react-chartjs-2`) and **Recharts** — two charting libraries coexist intentionally
- **Radix UI** primitives wrapped shadcn/ui-style in `app/components/ui/`
- **date-fns**, **react-dropzone**, **lucide-react**, **react-markdown** + **remark-gfm**
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
├── dashboard/page.tsx       # Main app: Tabs = Pacing Tool | Revenue Tracker | PMS Connector | Mini Course
├── admin/                   # Admin password gate + course editor (/admin/course)
├── api/auth/                # login/logout: server-side password check, sets 1-year httpOnly cookie
├── api/pms/                 # Server-side proxy routes to PMS APIs (see integrations.md)
│   ├── validate/route.ts    # Credential validation for all providers
│   ├── hostaway/  hospitable/  guesty/  hostfully/  ownerrez/
│   └── {provider}/_lib/auth.ts   # OAuth token exchange (hostaway, guesty)
├── components/
│   ├── ui/                  # shadcn-style primitives (button, dialog, tabs, toast, …)
│   ├── admin/               # Course editor: ModulePanel, LessonEditor, MarkdownEditor/Preview
│   ├── modules/             # One folder/file per dashboard tab
│   │   ├── PMSConnector.tsx + pms-connector/   # ConnectScreen, PMSDashboard, pacing/reservations tables
│   │   ├── RevenueTracker.tsx + revenue-tracker/
│   │   ├── MiniCourse.tsx + mini-course/       # EmailGateModal, useEmailGate, LessonSidebar
│   │   └── ComingSoonAPI.tsx
│   ├── Navbar.tsx, UploadScreen.tsx, Dashboard.tsx, KPICard.tsx, ScheduleModal.tsx
│   └── *Chart.tsx, MonthlyTable.tsx, LeadTimeHistogram.tsx   # CSV-pacing dashboard charts
├── utils/                   # PMS normalizers ({guesty,hostaway,hospitable,hostfully,ownerrez}Normalizer.ts)
│   └── bookingPacingUtils.ts
lib/
├── firebase.ts              # Firebase init (env-driven), exports `db`
├── firestore-course.ts      # CRUD for `modules` + `lessons` collections
├── firestore-subscribers.ts # `subscribers` collection (email gate)
└── utils.ts                 # cn()
utils/                       # (root-level) CSV pacing engine
├── csvParser.ts             # Custom CSV parser, detectPMS(), column mapping
├── dataProcessing.ts        # Core business logic: STLY filtering, KPIs, pacing
└── chartSetup.ts            # Chart.js global registration
types.ts                     # Pacing domain types (Reservation, KPIMetrics, PacingDataPoint, …)
types/course.ts              # Firestore course model (CourseModule, CourseLesson)
scripts/
├── seed-course.ts           # npx tsx scripts/seed-course.ts — seeds Firestore course
└── list-lessons.ts          # npx tsx scripts/list-lessons.ts
public/                      # Logos, PMS provider images, course assets
```

Leftovers to ignore: `dist/` (old Vite build), stale Vite `README.md`.

## Routes

| Route | Purpose | Guard |
|---|---|---|
| `/` | Redirect to `/login` | — |
| `/login` | Event password gate | middleware (bounces authed → `/dashboard`) |
| `/dashboard` | Main tabbed app | middleware (`revfactor_auth` cookie) |
| `/admin` | Admin password entry | middleware (bounces authed → `/admin/course`) |
| `/admin/course` | Course CMS (modules/lessons CRUD) | middleware (`revfactor_admin_auth` cookie) |
| `/api/auth/*` | Password login/logout, sets/clears httpOnly cookies | none |
| `/api/pms/*` | PMS proxy endpoints (POST, user-supplied keys) | none (stateless) |

Route protection lives in root `middleware.ts` (edge middleware reading cookies). There are no client-side guards.

## Data models

- **Firestore collections**: `modules` (title, description, order), `lessons` (moduleId, title, duration, content [Markdown], order, available), `subscribers` (email gate signups). Types in `types/course.ts`.
- **Pacing domain**: `Reservation`, `MonthlyMetric`, `KPIMetrics`, `PacingDataPoint`, `LeadTimeBucket`, `ChannelMix` in root `types.ts`.

## Commands

```
npm run dev      # Next.js dev server
npm run build    # Production build (runs TS check)
npm run start    # Serve production build
npm run lint     # next lint
npx tsx scripts/seed-course.ts   # Seed Firestore course (needs .env.local)
```

No test runner is configured (TBD).
