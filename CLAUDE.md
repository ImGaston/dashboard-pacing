# CLAUDE.md - RevFactor Pacing Dashboard

## Project Overview

RevFactor is a client-side revenue pacing dashboard for short-term rental (STR) property managers. Users upload CSV exports from their Property Management System (PMS) and get an analytics dashboard comparing current year vs previous year performance. No backend — all processing happens in the browser.

Target users: STR property managers using Hostaway, Hospitable, or any PMS that exports CSV.

## Tech Stack

- **React 19** + **TypeScript 5.9** + **Vite 7**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`, theme defined in `src/index.css` using `@theme`)
- **Chart.js** (`react-chartjs-2`) — Doughnut, Bar, Line charts
- **Recharts** — ComposedChart (PacingSnapshot), LineChart (BookingCurve)
- **date-fns** — all date manipulation
- **react-dropzone** — file upload drag-and-drop
- **lucide-react** — icons
- **clsx + tailwind-merge** — `cn()` utility in `src/lib/utils.ts` (shadcn/ui pattern)
- **html2canvas + jspdf** — declared for PDF export (not yet wired up)
- **framer-motion** — declared but not yet used in components
- **papaparse** — declared as dependency but a custom CSV parser is used instead (`src/utils/csvParser.ts`)

## Project Structure

```
src/
├── App.tsx              # Root component, state-based view switching (upload | dashboard)
├── App.css              # Leftover Vite template styles (unused)
├── index.css            # Tailwind imports + custom theme (colors, fonts)
├── main.tsx             # Entry point, registers Chart.js
├── types.ts             # All TypeScript interfaces (Reservation, DashboardData, KPIs, etc.)
├── lib/
│   └── utils.ts         # cn() utility (clsx + tailwind-merge)
├── utils/
│   ├── chartSetup.ts    # Chart.js global registration and defaults
│   ├── csvParser.ts     # CSV parsing, PMS detection, column mapping
│   └── dataProcessing.ts # Core business logic: STLY filtering, KPI calculation, pacing, etc.
├── components/
│   ├── UploadScreen.tsx       # PMS selection, file upload, column mapping, validation
│   ├── Dashboard.tsx          # Main dashboard layout, listing filter, all chart sections
│   ├── KPICard.tsx            # Single KPI metric card with YoY comparison
│   ├── PacingChart.tsx        # Chart.js Line — cumulative revenue pacing
│   ├── PacingSnapshotChart.tsx # Recharts ComposedChart — monthly OTB vs STLY bars + Final line
│   ├── BookingCurveChart.tsx  # Recharts LineChart — booking velocity by days-out
│   ├── ChannelMixChart.tsx    # Chart.js Doughnut — revenue by channel
│   ├── MonthlyTable.tsx       # HTML table — 12-month Rev/Occ%/ADR comparison
│   └── LeadTimeHistogram.tsx  # Chart.js Bar — lead time distribution buckets
└── assets/
    └── react.svg        # Default Vite asset (unused)
```

## Environment Variables

None required. This is a fully client-side app with no API keys or backend services.

## Running Locally

```bash
npm install
npm run dev        # Vite dev server with HMR
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production build locally
npm run lint       # ESLint
```

## Deploy

Static site — deploy the `dist/` folder after `npm run build`. Works with Vercel, Netlify, or any static host.

For Vercel:
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Design System

### Colors (defined in `src/index.css` via `@theme`)

| Token     | Hex       | Usage                          |
|-----------|-----------|--------------------------------|
| `bone`    | `#DDDAD3` | Background, neutral surfaces   |
| `cedar`   | `#13342D` | Primary (buttons, accents)     |
| `moss`    | `#5D6D59` | Secondary text, labels         |
| `walnut`  | `#76574C` | Chart secondary, previous year |
| `tobacco` | `#3F261F` | Body text                      |
| `onyx`    | `#161910` | Headings, bold text            |

### Fonts

- **Headings**: `Cormorant Garamond` (serif, loaded from Google Fonts in `index.html`)
- **Body**: `Helvetica, Arial, sans-serif`

### Component Conventions

- Use Tailwind utility classes, combine with `cn()` from `src/lib/utils.ts`
- White card containers: `bg-white p-6 rounded-xl shadow-sm border border-bone`
- Uppercase tracking labels: `text-xs font-bold text-moss uppercase tracking-widest`
- Charts use the custom color palette, not generic Chart.js/Recharts defaults
- Chart.js tooltips styled with onyx bg + Cormorant Garamond title font

## Key Patterns & Conventions

### View Switching (No Router)
`App.tsx` uses `useState<'upload' | 'dashboard'>` to switch between views. No react-router.

### STLY (Same Time Last Year) Logic
Core business concept in `dataProcessing.ts`. When comparing years:
- Current year data: reservations with check-in in current year AND booked on/before comparison date
- Previous year data: reservations with check-in in previous year AND booked on/before (comparison date - 1 year)

### CSV Parsing
- Custom parser in `csvParser.ts` (not using papaparse despite it being a dependency)
- Auto-detects PMS type from CSV headers via `detectPMS()`
- Supports Hostaway (2 files: prev + curr year), Hospitable (single file), Custom (manual column mapping)
- Status filtering: Hospitable filters `status === 'accepted'`; Custom allows user-defined status filter

### Two Charting Libraries
- **Chart.js** (`react-chartjs-2`): PacingChart, ChannelMixChart, LeadTimeHistogram — simpler charts
- **Recharts**: PacingSnapshotChart, BookingCurveChart — more complex composed/interactive charts
- Chart.js is globally registered in `src/utils/chartSetup.ts` (imported in `main.tsx`)

### Data Flow
1. `UploadScreen` parses CSV → produces `Reservation[]`
2. `App` stores `rawData` + `comparisonDate` in state
3. `Dashboard` calls `processData(rawData, comparisonDate, selectedListing)` → `DashboardData`
4. `DashboardData` is distributed to individual chart/table components

## Known Issues & Gotchas

1. **Hardcoded years in some components**: `BookingCurveChart` and `PacingSnapshotChart` hardcode 2025/2026 instead of deriving from `comparisonDate`. The `Dashboard` component and `dataProcessing.ts` derive years dynamically.

2. **Unused dependencies**: `papaparse` (custom parser used instead), `framer-motion` (not used yet), `html2canvas`/`jspdf` (PDF export not wired up).

3. **`App.css` is leftover Vite template** — contains default styles that are not used.

4. **Occupancy calculation assumes listing count from CSV data** — if a listing has zero bookings in a month, it's still counted in the denominator only if it appears elsewhere in the dataset. No external "total available listings" input.

5. **BookingCurveChart performance**: iterates 366 points x N reservations on every render for the selected month. Fine for typical STR datasets (<10k rows) but could be optimized with pre-sorting.

6. **No error boundaries** — parsing failures show `alert()` dialogs.

7. **Typo in Dashboard.tsx**: "Cummulative" should be "Cumulative" (line 162).

8. **`rawData` typed as `any[]`** in `Dashboard` props instead of `Reservation[]`.
