"use client";

import { useState, useCallback } from "react";
import { BarChart3, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Dashboard } from "@/app/components/Dashboard";
import {
  normalizeAllHostaway,
  buildListingsMap,
} from "@/app/utils/hostawayNormalizer";
import type { Reservation, PMSCredentials } from "@/types";

interface PacingTabContentProps {
  credentials: PMSCredentials;
}

function buildHeaders(creds: PMSCredentials): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${creds.apiKey}`,
  };
  if (creds.provider === "hostaway" && creds.accountId) {
    headers["X-Account-Id"] = creds.accountId;
  }
  return headers;
}

export function PacingTabContent({ credentials }: PacingTabContentProps) {
  const [data, setData] = useState<Reservation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonDate, setComparisonDate] = useState<Date>(new Date());
  const [totalFetched, setTotalFetched] = useState(0);

  const fetchPacingData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const headers = buildHeaders(credentials);
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear - 1}-01-01`;
    const endDate = `${currentYear}-12-31`;

    try {
      // 1. Fetch listings to build name map
      const listRes = await fetch("/api/pms/hostaway/listings", { headers });
      let listingsMap = new Map<number, string>();
      if (listRes.ok) {
        const listData = await listRes.json();
        listingsMap = buildListingsMap(listData.result || []);
      }

      // 2. Fetch ALL reservations with pagination
      const resRes = await fetch(
        `/api/pms/hostaway/reservations?all=true&startDate=${startDate}&endDate=${endDate}`,
        { headers }
      );

      if (!resRes.ok) {
        throw new Error(`Failed to fetch reservations (${resRes.status})`);
      }

      const resData = await resRes.json();
      const rawReservations = resData.result || [];
      setTotalFetched(rawReservations.length);

      // 3. Normalize to Reservation[]
      const normalized = normalizeAllHostaway(rawReservations, listingsMap);
      setData(normalized);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load pacing data."
      );
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="py-12">
        <div className="flex items-start gap-3 bg-error-bg border border-error/30 text-error text-sm p-4 rounded-[12px] mb-4">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPacingData}>
          Try Again
        </Button>
      </div>
    );
  }

  // Data loaded: show dashboard
  if (data) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 bg-bone-light border border-bone-dark/40 rounded-[12px] px-4 py-3">
          <p className="text-xs text-moss">
            {data.length} reservations loaded ({totalFetched} total from API)
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setData(null)}
            className="text-xs"
          >
            Reset
          </Button>
        </div>
        <Dashboard
          rawData={data}
          comparisonDate={comparisonDate}
          onBack={() => setData(null)}
        />
      </div>
    );
  }

  // Initial CTA state
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-bone-light p-8 rounded-[16px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone max-w-md">
        <BarChart3 className="h-12 w-12 text-cedar mx-auto mb-4" />
        <h3 className="text-xl font-serif text-onyx mb-2">
          Generate Pacing Dashboard
        </h3>
        <p className="text-sm text-moss mb-6">
          Fetch all your Hostaway reservations and generate the full revenue
          pacing dashboard with STLY comparison, booking curves, and more.
        </p>

        <div className="mb-6">
          <label className="block text-[9px] font-bold text-moss uppercase tracking-[2px] mb-2">
            Comparison Date
          </label>
          <input
            type="date"
            value={comparisonDate.toISOString().split("T")[0]}
            onChange={(e) => setComparisonDate(new Date(e.target.value + "T12:00:00"))}
            className="bg-bone border border-bone-dark/50 rounded-full py-2 px-4 text-sm text-onyx focus:outline-none focus:ring-2 focus:ring-cedar/20 w-full"
          />
        </div>

        <Button
          onClick={fetchPacingData}
          className="w-full bg-cedar text-bone hover:bg-onyx"
        >
          Generate Dashboard
        </Button>
      </div>
    </div>
  );
}
