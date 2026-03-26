"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Unplug, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { ListingsTable } from "./ListingsTable";
import { ReservationsTable } from "./ReservationsTable";
import { FinancialsChart } from "./FinancialsChart";
import { PacingTabContent } from "./PacingTabContent";
import { BookingPacingTab } from "./BookingPacingTab";
import {
  normalizeAllHostaway,
  buildListingsMap as buildPacingListingsMap,
} from "@/app/utils/hostawayNormalizer";
import {
  normalizeAllHospitable,
  buildHospitablePropertiesMap,
} from "@/app/utils/hospitableNormalizer";
import {
  normalizeAllOwnerrez,
  buildOwnerrezPropertiesMap,
} from "@/app/utils/ownerrezNormalizer";
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

function buildHeaders(creds: PMSCredentials): HeadersInit {
  if (creds.provider === "ownerrez" && creds.email) {
    // OwnerRez uses HTTP Basic Auth: base64(email:apiToken)
    const basicAuth = btoa(`${creds.email}:${creds.apiKey}`);
    return { Authorization: `Basic ${basicAuth}` };
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${creds.apiKey}`,
  };
  if (creds.provider === "hostaway" && creds.accountId) {
    headers["X-Account-Id"] = creds.accountId;
  }
  return headers;
}

/**
 * Compute financials (monthly revenue) from raw Hospitable reservation data.
 * Avoids a separate API call that would trigger rate limiting.
 */
function computeHospitableFinancials(rawReservations: any[]): PMSFinancialMonth[] {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthMap: Record<string, number> = {};

  for (const r of rawReservations) {
    const checkIn = r.check_in || r.arrival_date;
    if (!checkIn) continue;
    const date = new Date(checkIn);
    if (isNaN(date.getTime())) continue;

    const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

    const hostRevenue = r.financials?.host?.revenue?.amount;
    const hostAccomm = r.financials?.host?.accommodation?.amount;
    const guestTotal = r.financials?.guest?.total_price?.amount;
    const guestAccomm = r.financials?.guest?.accommodation?.amount;
    const payments = r.financials?.guest?.payments;
    const paymentsSum = Array.isArray(payments)
      ? payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
      : 0;

    const cents =
      (hostRevenue && hostRevenue > 0 ? hostRevenue : null) ??
      (hostAccomm && hostAccomm > 0 ? hostAccomm : null) ??
      (guestTotal && guestTotal > 0 ? guestTotal : null) ??
      (guestAccomm && guestAccomm > 0 ? guestAccomm : null) ??
      (paymentsSum > 0 ? paymentsSum : 0);

    monthMap[key] = (monthMap[key] || 0) + cents / 100;
  }

  return sortFinancials(monthMap);
}

/**
 * Compute financials from OwnerRez booking data.
 * Revenue is already in dollars (no cents conversion).
 */
function computeOwnerrezFinancials(rawBookings: any[]): PMSFinancialMonth[] {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthMap: Record<string, number> = {};

  for (const b of rawBookings) {
    const arrival = b.arrival;
    if (!arrival) continue;
    const date = new Date(arrival);
    if (isNaN(date.getTime())) continue;

    const status = (b.status || "").toLowerCase();
    if (status === "canceled") continue;
    if (b.is_block) continue;

    const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    const revenue = b.total_amount || 0;
    monthMap[key] = (monthMap[key] || 0) + revenue;
  }

  return sortFinancials(monthMap);
}

function sortFinancials(monthMap: Record<string, number>): PMSFinancialMonth[] {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Object.entries(monthMap)
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => {
      const [am, ay] = a.month.split(" ");
      const [bm, by] = b.month.split(" ");
      return MONTHS.indexOf(am) + parseInt(ay) * 12 - (MONTHS.indexOf(bm) + parseInt(by) * 12);
    })
    .slice(-24);
}

/* ── Listing normalizers ── */

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
    name: p.name || p.public_name || "Unnamed",
    state: p.address?.state || "",
    city: p.address?.city || "",
    personCapacity: Number(p.capacity?.max || 0),
    bedrooms: Number(p.capacity?.bedrooms || 0),
    bathrooms: Number(p.capacity?.bathrooms || 0),
  }));
}

function normalizeOwnerrezListings(raw: any[]): PMSListing[] {
  return raw.map((p) => ({
    id: String(p.id),
    name: p.external_name || p.name || "Unnamed",
    state: p.address?.state || "",
    city: p.address?.city || "",
    personCapacity: Number(p.max_guests || 0),
    bedrooms: Number(p.bedrooms || 0),
    bathrooms: Number(p.bathrooms || 0),
  }));
}

/* ── Reservation normalizers (for table display) ── */

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
  return raw.map((r) => {
    const firstName = r.guest?.first_name || "";
    const lastName = r.guest?.last_name || "";
    const guestName = [firstName, lastName].filter(Boolean).join(" ") || "Guest";

    const hostRevenue = r.financials?.host?.revenue?.amount;
    const hostAccomm = r.financials?.host?.accommodation?.amount;
    const guestTotal = r.financials?.guest?.total_price?.amount;
    const guestAccomm = r.financials?.guest?.accommodation?.amount;
    const paymentsTotal = Array.isArray(r.financials?.guest?.payments)
      ? r.financials.guest.payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
      : 0;
    const cents =
      (hostRevenue && hostRevenue > 0 ? hostRevenue : null) ??
      (hostAccomm && hostAccomm > 0 ? hostAccomm : null) ??
      (guestTotal && guestTotal > 0 ? guestTotal : null) ??
      (guestAccomm && guestAccomm > 0 ? guestAccomm : null) ??
      (paymentsTotal > 0 ? paymentsTotal : 0);
    const revenue = (typeof cents === "number" ? cents : parseFloat(String(cents))) / 100;

    return {
      id: String(r.id),
      guestName,
      listingName: r.properties?.[0]?.name || r.properties?.[0]?.public_name || "Unknown",
      checkIn: r.check_in || r.arrival_date || "",
      checkOut: r.check_out || r.departure_date || "",
      reservationDate: r.booking_date || "",
      revenue,
      status: r.reservation_status?.current?.category || r.status || "Unknown",
      channel: r.platform || "Direct",
    };
  });
}

function normalizeOwnerrezReservations(raw: any[], listingsMap: Map<string, string>): PMSReservation[] {
  return raw.map((b) => {
    const firstName = b.guest?.first_name || "";
    const lastName = b.guest?.last_name || "";
    const guestName = [firstName, lastName].filter(Boolean).join(" ") || "Guest";
    const propId = String(b.property_id || "");

    return {
      id: String(b.id),
      guestName,
      listingName: listingsMap.get(propId) || b.property?.external_name || b.property?.name || "Unknown",
      checkIn: b.arrival || "",
      checkOut: b.departure || "",
      reservationDate: b.booked_utc || b.created_utc || "",
      revenue: b.total_amount || 0,
      status: b.status || "Unknown",
      channel: b.listing_site || "Direct",
    };
  });
}

/* ── Provider label ── */

const PROVIDER_LABELS: Record<string, string> = {
  hostaway: "Hostaway",
  hospitable: "Hospitable",
  ownerrez: "OwnerRez",
};

/* ── Main component ── */

export function PMSDashboard({ credentials, onDisconnect }: PMSDashboardProps) {
  const [listings, setListings] = useState<PMSListing[]>([]);
  const [reservations, setReservations] = useState<PMSReservation[]>([]);
  const [financials, setFinancials] = useState<PMSFinancialMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Pacing state
  const [pacingData, setPacingData] = useState<Reservation[] | null>(null);
  const [pacingComparisonDate, setPacingComparisonDate] = useState<Date>(new Date());
  const [pacingTotalFetched, setPacingTotalFetched] = useState(0);

  const prov = credentials.provider;

  // Process raw data into all normalized states
  const processRawData = useCallback((rawListings: any[], rawReservations: any[], rawFinancials: any[]) => {
    // Listings
    const normalizedListings =
      prov === "hostaway"
        ? normalizeHostawayListings(rawListings)
        : prov === "ownerrez"
          ? normalizeOwnerrezListings(rawListings)
          : normalizeHospitableListings(rawListings);
    setListings(normalizedListings);

    // Build id → name map for reservation normalization
    const listingsMap = new Map<string, string>();
    for (const l of normalizedListings) {
      listingsMap.set(l.id, l.name);
    }

    // Reservations (for table)
    setReservations(
      prov === "hostaway"
        ? normalizeHostawayReservations(rawReservations, listingsMap)
        : prov === "ownerrez"
          ? normalizeOwnerrezReservations(rawReservations, listingsMap)
          : normalizeHospitableReservations(rawReservations)
    );

    // Pacing data (for dashboard charts)
    if (prov === "hostaway") {
      const pacingListingsMap = buildPacingListingsMap(rawListings);
      setPacingData(normalizeAllHostaway(rawReservations, pacingListingsMap));
    } else if (prov === "ownerrez") {
      const propsMap = buildOwnerrezPropertiesMap(rawListings);
      setPacingData(normalizeAllOwnerrez(rawReservations, propsMap));
    } else {
      const propsMap = buildHospitablePropertiesMap(rawListings);
      setPacingData(normalizeAllHospitable(rawReservations, propsMap));
    }
    setPacingTotalFetched(rawReservations.length);

    // Financials
    setFinancials(rawFinancials);
  }, [prov]);

  // Fetch fresh data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const headers = buildHeaders(credentials);

    try {
      let rawListings: any[] = [];
      let rawReservations: any[] = [];
      let rawFinancials: any[] = [];

      if (prov === "hostaway") {
        // Hostaway: fetch all 3 in parallel (no rate limit issues)
        const [listRes, resRes, finRes] = await Promise.allSettled([
          fetch("/api/pms/hostaway/listings", { headers }),
          fetch("/api/pms/hostaway/reservations?all=true", { headers }),
          fetch("/api/pms/hostaway/financials", { headers }),
        ]);

        if (listRes.status === "fulfilled" && listRes.value.ok) {
          const data = await listRes.value.json();
          rawListings = data.result || data.data || [];
        }
        if (resRes.status === "fulfilled" && resRes.value.ok) {
          const data = await resRes.value.json();
          rawReservations = data.result || data.data || [];
        }
        if (finRes.status === "fulfilled" && finRes.value.ok) {
          const data = await finRes.value.json();
          rawFinancials = data.result || data.data || [];
        }
      } else if (prov === "ownerrez") {
        // OwnerRez: properties + reservations in parallel, financials computed client-side
        const [listRes, resRes] = await Promise.allSettled([
          fetch("/api/pms/ownerrez/properties", { headers }),
          fetch("/api/pms/ownerrez/reservations?all=true", { headers }),
        ]);

        if (listRes.status === "fulfilled" && listRes.value.ok) {
          const data = await listRes.value.json();
          rawListings = data.data || [];
        }
        if (resRes.status === "fulfilled" && resRes.value.ok) {
          const data = await resRes.value.json();
          rawReservations = data.data || [];
        }

        rawFinancials = computeOwnerrezFinancials(rawReservations);
      } else {
        // Hospitable: fetch sequentially to avoid rate limiting
        const listRes = await fetch("/api/pms/hospitable/properties", { headers });
        if (listRes.ok) {
          const data = await listRes.json();
          rawListings = data.result || data.data || [];
        }

        const propIds = rawListings.map((p: any) => p.id).filter(Boolean);
        const propsParam = propIds
          .map((id: string) => `properties[]=${encodeURIComponent(id)}`)
          .join("&");
        const resRes = await fetch(
          `/api/pms/hospitable/reservations?all=true&${propsParam}`,
          { headers }
        );
        if (resRes.ok) {
          const data = await resRes.json();
          rawReservations = data.result || data.data || [];
        }

        rawFinancials = computeHospitableFinancials(rawReservations);
      }

      // Check if all failed
      const allFailed =
        rawListings.length === 0 &&
        rawReservations.length === 0 &&
        rawFinancials.length === 0;

      if (allFailed) {
        setError(
          "Could not fetch data from your PMS. Your credentials may have expired."
        );
      } else {
        processRawData(rawListings, rawReservations, rawFinancials);

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
  }, [credentials, prov, processRawData]);

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

  const providerLabel = PROVIDER_LABELS[credentials.provider] || credentials.provider;

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
          <TabsTrigger value="booking-pacing">Booking Pacing</TabsTrigger>
        </TabsList>

        <TabsContent value="pacing">
          <PacingTabContent
            data={pacingData}
            setData={setPacingData}
            comparisonDate={pacingComparisonDate}
            setComparisonDate={setPacingComparisonDate}
            totalFetched={pacingTotalFetched}
            loading={loading}
            pmsName={PROVIDER_LABELS[credentials.provider] ?? credentials.provider}
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

        <TabsContent value="booking-pacing">
          <BookingPacingTab data={pacingData} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
