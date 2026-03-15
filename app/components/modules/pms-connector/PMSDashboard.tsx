"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Unplug, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { ListingsTable } from "./ListingsTable";
import { ReservationsTable } from "./ReservationsTable";
import { FinancialsChart } from "./FinancialsChart";
import { PacingTabContent } from "./PacingTabContent";
import {
  normalizeAllHostaway,
  buildListingsMap as buildPacingListingsMap,
} from "@/app/utils/hostawayNormalizer";
import type { PMSCredentials, PMSListing, PMSReservation, PMSFinancialMonth, Reservation } from "@/types";

interface PMSDashboardProps {
  credentials: PMSCredentials;
  onDisconnect: () => void;
}

/* ── localStorage cache for raw API data ─────────────────────── */
const CACHE_KEY = "revfactor_pms_cache";

interface PMSCache {
  rawListings: any[];
  rawReservations: any[];
  rawFinancials: any[];
  lastSynced: string;
  provider: string;
}

function loadCache(provider: string): PMSCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PMSCache;
    // Only use cache if same provider
    if (parsed.provider !== provider) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(cache: PMSCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full — silently ignore
  }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
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

function normalizeHostawayListings(raw: any[]): PMSListing[] {
  return raw.map((l) => ({
    id: String(l.id),
    name: l.internalListingName || l.name || "Unnamed",
    state: l.state || l.address?.state || "",
    city: l.city || l.address?.city || "",
    personCapacity: Number(l.personCapacity || l.guestsIncluded || 0),
    bedrooms: Number(l.bedroomsNumber || l.bedrooms || 0),
    bathrooms: Number(l.bathroomsNumber || l.bathrooms || 0),
  }));
}

function normalizeHospitableListings(raw: any[]): PMSListing[] {
  return raw.map((p) => ({
    id: String(p.id),
    name: p.name || p.nickname || "Unnamed",
    state: p.state || p.address?.state || "",
    city: p.city || p.address?.city || "",
    personCapacity: Number(p.person_capacity || p.guests || 0),
    bedrooms: Number(p.bedrooms || 0),
    bathrooms: Number(p.bathrooms || 0),
  }));
}

function normalizeHostawayReservations(raw: any[], listingsMap: Map<string, string>): PMSReservation[] {
  return raw.map((r) => {
    const listingId = String(r.listingMapId || r.listingId || "");
    const internalName = listingsMap.get(listingId);
    return {
      id: String(r.id),
      guestName: r.guestName || r.guestFirstName || "Guest",
      listingName: internalName || r.listingName || `Listing ${listingId}`,
      checkIn: r.arrivalDate || r.checkInDate || "",
      checkOut: r.departureDate || r.checkOutDate || "",
      reservationDate: r.reservationDate || r.createdAt || "",
      revenue: parseFloat(r.totalPrice || r.hostPayout || r.basePrice || "0"),
      status: r.status || "Unknown",
      channel: r.channelName || r.source || "Direct",
    };
  });
}

function normalizeHospitableReservations(raw: any[]): PMSReservation[] {
  return raw.map((r) => ({
    id: String(r.id),
    guestName: r.guest_name || r.guest?.name || "Guest",
    listingName: r.property_name || r.listing_name || `Property ${r.property_id || ""}`,
    checkIn: r.check_in || r.checkin_date || "",
    checkOut: r.check_out || r.checkout_date || "",
    reservationDate: r.reservation_date || r.created_at || "",
    revenue: parseFloat(r.total_paid || r.host_payout || r.total_price || "0"),
    status: r.status || "Unknown",
    channel: r.channel || r.platform || "Direct",
  }));
}

export function PMSDashboard({ credentials, onDisconnect }: PMSDashboardProps) {
  const [listings, setListings] = useState<PMSListing[]>([]);
  const [reservations, setReservations] = useState<PMSReservation[]>([]);
  const [financials, setFinancials] = useState<PMSFinancialMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Pacing state (lifted from PacingTabContent to survive tab switches)
  const [pacingData, setPacingData] = useState<Reservation[] | null>(null);
  const [pacingComparisonDate, setPacingComparisonDate] = useState<Date>(new Date());
  const [pacingTotalFetched, setPacingTotalFetched] = useState(0);

  const isHostaway = credentials.provider === "hostaway";

  // Process raw data into all normalized states
  const processRawData = useCallback((rawListings: any[], rawReservations: any[], rawFinancials: any[]) => {
    // Listings
    const normalizedListings = isHostaway
      ? normalizeHostawayListings(rawListings)
      : normalizeHospitableListings(rawListings);
    setListings(normalizedListings);

    // Build id → internal name map for reservation normalization
    const listingsMap = new Map<string, string>();
    for (const l of normalizedListings) {
      listingsMap.set(l.id, l.name);
    }

    // Reservations (for table)
    setReservations(
      isHostaway
        ? normalizeHostawayReservations(rawReservations, listingsMap)
        : normalizeHospitableReservations(rawReservations)
    );

    // Pacing data (for dashboard)
    if (isHostaway) {
      const pacingListingsMap = buildPacingListingsMap(rawListings);
      const pacingNormalized = normalizeAllHostaway(rawReservations, pacingListingsMap);
      setPacingData(pacingNormalized);
      setPacingTotalFetched(rawReservations.length);
    }

    // Financials
    setFinancials(rawFinancials);
  }, [isHostaway]);

  // Fetch fresh data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const headers = buildHeaders(credentials);

    try {
      // Fetch listings first (needed for internal name mapping), financials in parallel
      const [listRes, finRes] = await Promise.allSettled([
        fetch(
          isHostaway
            ? "/api/pms/hostaway/listings"
            : "/api/pms/hospitable/properties",
          { headers }
        ),
        fetch(
          isHostaway
            ? "/api/pms/hostaway/financials"
            : "/api/pms/hospitable/financials",
          { headers }
        ),
      ]);

      // Extract raw listings
      let rawListings: any[] = [];
      if (listRes.status === "fulfilled" && listRes.value.ok) {
        const data = await listRes.value.json();
        rawListings = data.result || data.data || [];
      }

      // Fetch ALL reservations with pagination
      const resRes = await fetch(
        isHostaway
          ? "/api/pms/hostaway/reservations?all=true"
          : "/api/pms/hospitable/reservations",
        { headers }
      );

      let rawReservations: any[] = [];
      if (resRes.ok) {
        const data = await resRes.json();
        rawReservations = data.result || data.data || [];
      }

      // Extract raw financials
      let rawFinancials: any[] = [];
      if (finRes.status === "fulfilled" && finRes.value.ok) {
        const data = await finRes.value.json();
        rawFinancials = data.result || data.data || [];
      }

      // Check if all failed
      const allFailed =
        listRes.status === "rejected" &&
        !resRes.ok &&
        finRes.status === "rejected";

      if (allFailed) {
        setError(
          "Could not fetch data from your PMS. Your credentials may have expired."
        );
      } else {
        // Process and normalize all data
        processRawData(rawListings, rawReservations, rawFinancials);

        // Cache raw data for next mount
        const syncTime = new Date().toLocaleString();
        saveCache({
          rawListings,
          rawReservations,
          rawFinancials,
          lastSynced: syncTime,
          provider: credentials.provider,
        });
        setLastSynced(syncTime);
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [credentials, isHostaway, processRawData]);

  // On mount: try cache first, otherwise fetch
  useEffect(() => {
    const cached = loadCache(credentials.provider);
    if (cached) {
      processRawData(cached.rawListings, cached.rawReservations, cached.rawFinancials);
      setLastSynced(cached.lastSynced);
      setLoading(false);
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const providerLabel =
    credentials.provider === "hostaway" ? "Hostaway" : "Hospitable";

  return (
    <div className="space-y-6">
      {/* Sync header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif text-onyx">
            {providerLabel} Dashboard
          </h2>
          {lastSynced && (
            <p className="text-xs text-moss mt-1">Last synced: {lastSynced}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sync Data
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            className="gap-2 text-error hover:text-error hover:bg-error-bg"
          >
            <Unplug className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 bg-error-bg border border-error/30 text-error text-sm p-4 rounded-[12px]">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Data tabs */}
      <Tabs defaultValue="pacing">
        <TabsList>
          <TabsTrigger value="pacing">Pacing Dashboard</TabsTrigger>
          <TabsTrigger value="listings">
            Listings ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="reservations">
            Reservations ({reservations.length})
          </TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="pacing">
          <PacingTabContent
            data={pacingData}
            setData={setPacingData}
            comparisonDate={pacingComparisonDate}
            setComparisonDate={setPacingComparisonDate}
            totalFetched={pacingTotalFetched}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="listings">
          <ListingsTable listings={listings} loading={loading} />
        </TabsContent>

        <TabsContent value="reservations">
          <ReservationsTable reservations={reservations} loading={loading} />
        </TabsContent>

        <TabsContent value="financials">
          <FinancialsChart financials={financials} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
