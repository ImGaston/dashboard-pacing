import {
  differenceInCalendarDays,
  subDays,
  format,
  startOfDay,
  parseISO,
} from "date-fns";
import type { Reservation } from "@/types";

/* ── Types ─────────────────────────────────────────────────── */

export interface KPIDelta {
  current: number;
  previous: number;
  delta: number; // percentage change
}

export interface BookingPacingKPIs {
  reservations: KPIDelta;
  revenue: KPIDelta;
  nights: KPIDelta;
  avgRevenue: KPIDelta;
}

export interface BookingPacingMonthBar {
  monthKey: string; // "2026-03"
  label: string; // "Mar 2026"
  currentRevenue: number;
  previousRevenue: number;
}

export interface BookingPacingRow {
  reservationDate: Date;
  checkInDate: Date;
  listing: string;
  channel: string;
  nights: number;
  revenue: number;
  impactPct: number;
}

export interface ComparisonPeriod {
  from: Date;
  to: Date;
  days: number;
}

/* ── Period computation ────────────────────────────────────── */

export function computeComparisonPeriod(
  from: Date,
  to: Date
): ComparisonPeriod {
  const daysDiff = differenceInCalendarDays(to, from); // e.g. 28 for a 29-day inclusive window
  const compTo = subDays(from, 1);
  const compFrom = subDays(compTo, daysDiff);
  return {
    from: startOfDay(compFrom),
    to: startOfDay(compTo),
    days: daysDiff + 1,
  };
}

/* ── Filtering ─────────────────────────────────────────────── */

export function filterByBookingWindow(
  reservations: Reservation[],
  from: Date,
  to: Date,
  property?: string | null
): Reservation[] {
  const fromStart = startOfDay(from);
  const toStart = startOfDay(to);

  return reservations.filter((r) => {
    if (r.revenue <= 0) return false;
    const bookingDay = startOfDay(r.reservationDate);
    if (bookingDay < fromStart || bookingDay > toStart) return false;
    if (property && property !== "all" && r.listing !== property) return false;
    return true;
  });
}

/* ── KPI aggregation ───────────────────────────────────────── */

function calcDelta(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100; // represent as +100% when going from 0
  return ((current - previous) / previous) * 100;
}

export function computeKPIs(
  current: Reservation[],
  previous: Reservation[]
): BookingPacingKPIs {
  const curCount = current.length;
  const prevCount = previous.length;
  const curRevenue = current.reduce((s, r) => s + r.revenue, 0);
  const prevRevenue = previous.reduce((s, r) => s + r.revenue, 0);
  const curNights = current.reduce((s, r) => s + r.nights, 0);
  const prevNights = previous.reduce((s, r) => s + r.nights, 0);
  const curAvg = curCount > 0 ? curRevenue / curCount : 0;
  const prevAvg = prevCount > 0 ? prevRevenue / prevCount : 0;

  return {
    reservations: {
      current: curCount,
      previous: prevCount,
      delta: calcDelta(curCount, prevCount),
    },
    revenue: {
      current: curRevenue,
      previous: prevRevenue,
      delta: calcDelta(curRevenue, prevRevenue),
    },
    nights: {
      current: curNights,
      previous: prevNights,
      delta: calcDelta(curNights, prevNights),
    },
    avgRevenue: {
      current: curAvg,
      previous: prevAvg,
      delta: calcDelta(curAvg, prevAvg),
    },
  };
}

/* ── Revenue grouped by check-in month ─────────────────────── */

function toMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

function monthLabel(monthKey: string): string {
  const d = parseISO(monthKey + "-01");
  return format(d, "MMM yyyy");
}

function groupByCheckinMonth(reservations: Reservation[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of reservations) {
    const key = toMonthKey(r.checkInDate);
    map.set(key, (map.get(key) || 0) + r.revenue);
  }
  return map;
}

export function buildChartData(
  current: Reservation[],
  previous: Reservation[]
): BookingPacingMonthBar[] {
  const curMap = groupByCheckinMonth(current);
  const prevMap = groupByCheckinMonth(previous);

  const allKeys = new Set([...curMap.keys(), ...prevMap.keys()]);
  const sorted = [...allKeys].sort();

  return sorted.map((key) => ({
    monthKey: key,
    label: monthLabel(key),
    currentRevenue: curMap.get(key) || 0,
    previousRevenue: prevMap.get(key) || 0,
  }));
}

/* ── Detail table rows ─────────────────────────────────────── */

export function buildDetailRows(
  current: Reservation[],
  totalRevenue: number
): BookingPacingRow[] {
  return current.map((r) => ({
    reservationDate: r.reservationDate,
    checkInDate: r.checkInDate,
    listing: r.listing,
    channel: r.channel,
    nights: r.nights,
    revenue: r.revenue,
    impactPct: totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0,
  }));
}

/* ── Formatting helpers ────────────────────────────────────── */

export function formatCurrency(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatDate(d: Date): string {
  return format(d, "MMM d, yyyy");
}

export function formatPeriodRange(from: Date, to: Date, days: number): string {
  return `${format(from, "MMM d, yyyy")} → ${format(to, "MMM d, yyyy")} (${days} days)`;
}
