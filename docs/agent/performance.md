# Performance

Minimal for now — the app is small and mostly client-rendered. Update this file when perf work happens.

## Current state

- **No caching layer.** PMS proxy routes fetch live on every request; no server-side cache, no revalidation strategy. Fine at current usage — revisit if PMS tabs feel slow or providers rate-limit.
- **Loading states**: PMS Connector uses `LoadingCarousel.tsx` during data fetch; other modules use simple conditional rendering. No Suspense/streaming.
- **CSV pacing engine** (`utils/dataProcessing.ts`) recomputes on every `processData()` call (comparison date / listing filter change). Acceptable for typical STR datasets (<10k rows).
- **BookingCurveChart** iterates ~366 points × N reservations per render for the selected month — known hotspot, fine at current scale; pre-sorting reservations would be the first optimization.
- **Chart.js is globally registered** once (`utils/chartSetup.ts` — imported where needed), avoiding per-component registration.

## Sensitive endpoints

- `app/api/pms/*/reservations` can return large payloads for big accounts; pagination handling lives in each route/normalizer — check before changing.
- Hostaway/Guesty OAuth token exchange happens per-request (no token cache) — an easy win if latency becomes an issue.

## Recommendations (not yet done)

- Cache PMS OAuth tokens (in-memory per lambda) if request volume grows.
- Memoize `processData()` output with `useMemo` keyed on (rawData, comparisonDate, selectedListing) if re-renders get expensive.
- Wire up the declared `html2canvas`/`jspdf` PDF export lazily (dynamic import) to keep the main bundle small.
