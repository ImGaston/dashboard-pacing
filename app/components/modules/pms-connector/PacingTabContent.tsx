"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Dashboard } from "@/app/components/Dashboard";
import type { Reservation } from "@/types";

interface PacingTabContentProps {
  data: Reservation[] | null;
  setData: (data: Reservation[] | null) => void;
  comparisonDate: Date;
  setComparisonDate: (date: Date) => void;
  totalFetched: number;
  loading: boolean;
}

export function PacingTabContent({
  data,
  setData,
  comparisonDate,
  setComparisonDate,
  totalFetched,
  loading,
}: PacingTabContentProps) {
  // Loading state (parent is fetching data)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-10 w-10 text-cedar animate-spin mb-4" />
        <p className="text-lg font-serif text-onyx">
          Loading reservations...
        </p>
        <p className="text-sm text-moss mt-1">
          Fetching all reservations from Hostaway. This may take a moment.
        </p>
      </div>
    );
  }

  // No data yet (sync failed or no reservations)
  if (!data) {
    return (
      <div className="py-12">
        <div className="flex items-start gap-3 bg-moss/5 border border-moss/20 text-moss text-sm p-4 rounded-[12px]">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>No reservation data available. Click &ldquo;Sync Data&rdquo; above to fetch your reservations.</p>
        </div>
      </div>
    );
  }

  // Data loaded: show dashboard
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 bg-bone-light border border-bone-dark/40 rounded-[12px] px-4 py-3">
        <p className="text-xs text-moss">
          {data.length} reservations loaded ({totalFetched} total from API)
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-bold text-moss uppercase tracking-[1.5px]">
              Comparison Date
            </label>
            <input
              type="date"
              value={comparisonDate.toISOString().split("T")[0]}
              onChange={(e) => setComparisonDate(new Date(e.target.value + "T12:00:00"))}
              className="bg-bone border border-bone-dark/50 rounded-lg py-1 px-2.5 text-xs text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setData(null)}
            className="text-xs"
          >
            Reset
          </Button>
        </div>
      </div>
      <Dashboard
        rawData={data}
        comparisonDate={comparisonDate}
        onBack={() => setData(null)}
      />
    </div>
  );
}
