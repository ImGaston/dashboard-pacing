"use client";

import { useState, useMemo } from "react";
import { Loader2, Info } from "lucide-react";
import { subDays, format, parseISO, differenceInCalendarDays } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { KPICard } from "@/app/components/KPICard";
import { BookingPacingChart } from "./BookingPacingChart";
import { BookingPacingTable } from "./BookingPacingTable";
import {
  computeComparisonPeriod,
  filterByBookingWindow,
  computeKPIs,
  buildChartData,
  buildDetailRows,
  formatCurrency,
  formatPeriodRange,
} from "@/app/utils/bookingPacingUtils";
import type { Reservation } from "@/types";

interface BookingPacingTabProps {
  data: Reservation[] | null;
  loading: boolean;
}

function defaultFrom(): string {
  return format(subDays(new Date(), 30), "yyyy-MM-dd");
}

function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function BookingPacingTab({ data, loading }: BookingPacingTabProps) {
  const [bookedFrom, setBookedFrom] = useState(defaultFrom);
  const [bookedTo, setBookedTo] = useState(today);
  const [selectedProperty, setSelectedProperty] = useState("all");

  // Unique listings for dropdown
  const uniqueListings = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((r) => r.listing).filter(Boolean))].sort();
  }, [data]);

  // All derived data
  const derived = useMemo(() => {
    if (!data || data.length === 0) return null;

    const from = parseISO(bookedFrom);
    const to = parseISO(bookedTo);

    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) return null;

    const compPeriod = computeComparisonPeriod(from, to);
    const currentDays = differenceInCalendarDays(to, from) + 1;

    const currentFiltered = filterByBookingWindow(data, from, to, selectedProperty);
    const previousFiltered = filterByBookingWindow(
      data,
      compPeriod.from,
      compPeriod.to,
      selectedProperty
    );

    const kpis = computeKPIs(currentFiltered, previousFiltered);
    const chartData = buildChartData(currentFiltered, previousFiltered);
    const detailRows = buildDetailRows(currentFiltered, kpis.revenue.current);

    return {
      from,
      to,
      currentDays,
      compPeriod,
      kpis,
      chartData,
      detailRows,
      currentFiltered,
    };
  }, [data, bookedFrom, bookedTo, selectedProperty]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-cedar" />
          <p className="text-sm text-moss">Loading reservation data…</p>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <Info className="h-8 w-8 text-moss/50" />
            <p className="text-sm text-moss">
              No reservation data available. Booking Pacing requires reservation
              data from your connected PMS.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Legend */}
      {derived && (
        <div className="bg-bone-light border border-bone-dark/40 rounded-[12px] px-4 py-3 flex flex-wrap gap-6 text-xs text-moss">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cedar" />
            <span className="font-medium text-onyx">Current:</span>
            <span>
              {formatPeriodRange(derived.from, derived.to, derived.currentDays)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-walnut" />
            <span className="font-medium text-onyx">Previous:</span>
            <span>
              {formatPeriodRange(
                derived.compPeriod.from,
                derived.compPeriod.to,
                derived.compPeriod.days
              )}
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[9px] font-bold text-moss uppercase tracking-[1.5px] mb-1.5">
            Booked From
          </label>
          <input
            type="date"
            value={bookedFrom}
            onChange={(e) => setBookedFrom(e.target.value)}
            className="w-full bg-bone border border-bone-dark/50 rounded-lg py-1.5 px-2.5 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-moss uppercase tracking-[1.5px] mb-1.5">
            Booked To
          </label>
          <input
            type="date"
            value={bookedTo}
            onChange={(e) => setBookedTo(e.target.value)}
            className="w-full bg-bone border border-bone-dark/50 rounded-lg py-1.5 px-2.5 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-moss uppercase tracking-[1.5px] mb-1.5">
            Property
          </label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full bg-bone border border-bone-dark/50 rounded-lg py-1.5 px-2.5 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
          >
            <option value="all">All Properties</option>
            {uniqueListings.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {derived ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Reservations"
              value={derived.kpis.reservations.current}
              prevValue={derived.kpis.reservations.previous}
              percentChange={derived.kpis.reservations.delta}
            />
            <KPICard
              title="Revenue Booked"
              value={derived.kpis.revenue.current}
              prevValue={derived.kpis.revenue.previous}
              percentChange={derived.kpis.revenue.delta}
              isCurrency
            />
            <KPICard
              title="Nights Booked"
              value={derived.kpis.nights.current}
              prevValue={derived.kpis.nights.previous}
              percentChange={derived.kpis.nights.delta}
            />
            <KPICard
              title="Avg Rev / Reservation"
              value={derived.kpis.avgRevenue.current}
              prevValue={derived.kpis.avgRevenue.previous}
              percentChange={derived.kpis.avgRevenue.delta}
              isCurrency
            />
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Check-in Month</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingPacingChart
                data={derived.chartData}
                currentLabel="Current Period"
                previousLabel="Previous Period"
              />
            </CardContent>
          </Card>

          {/* Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Reservation Detail
                <span className="ml-2 text-sm font-normal text-moss">
                  ({derived.currentFiltered.length} reservations)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <BookingPacingTable
                rows={derived.detailRows}
                totalRevenue={derived.kpis.revenue.current}
                totalNights={derived.kpis.nights.current}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-moss">
              Select a valid date range to see pacing data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
