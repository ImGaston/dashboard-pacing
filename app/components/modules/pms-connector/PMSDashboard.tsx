"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Unplug, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { ListingsTable } from "./ListingsTable";
import { ReservationsTable } from "./ReservationsTable";
import { FinancialsChart } from "./FinancialsChart";
import type { PMSCredentials, PMSListing, PMSReservation, PMSFinancialMonth } from "@/types";

interface PMSDashboardProps {
  credentials: PMSCredentials;
  onDisconnect: () => void;
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
    name: l.name || l.internalName || "Unnamed",
    type: l.propertyTypeId ? `Type ${l.propertyTypeId}` : l.type || "Property",
    status: l.isActive ? "Active" : l.status || "Inactive",
  }));
}

function normalizeHospitableListings(raw: any[]): PMSListing[] {
  return raw.map((p) => ({
    id: String(p.id),
    name: p.name || p.nickname || "Unnamed",
    type: p.property_type || p.type || "Property",
    status: p.status || "Active",
  }));
}

function normalizeHostawayReservations(raw: any[]): PMSReservation[] {
  return raw.map((r) => ({
    id: String(r.id),
    guestName: r.guestName || r.guestFirstName || "Guest",
    listingName: r.listingName || `Listing ${r.listingMapId || r.listingId || ""}`,
    checkIn: r.arrivalDate || r.checkInDate || "",
    checkOut: r.departureDate || r.checkOutDate || "",
    revenue: parseFloat(r.totalPrice || r.hostPayout || r.basePrice || "0"),
    status: r.status || "Unknown",
    channel: r.channelName || r.source || "Direct",
  }));
}

function normalizeHospitableReservations(raw: any[]): PMSReservation[] {
  return raw.map((r) => ({
    id: String(r.id),
    guestName: r.guest_name || r.guest?.name || "Guest",
    listingName: r.property_name || r.listing_name || `Property ${r.property_id || ""}`,
    checkIn: r.check_in || r.checkin_date || "",
    checkOut: r.check_out || r.checkout_date || "",
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const headers = buildHeaders(credentials);
    const isHostaway = credentials.provider === "hostaway";

    try {
      // Fetch all 3 endpoints in parallel
      const [listRes, resRes, finRes] = await Promise.allSettled([
        fetch(
          isHostaway
            ? "/api/pms/hostaway/listings"
            : "/api/pms/hospitable/properties",
          { headers }
        ),
        fetch(
          isHostaway
            ? "/api/pms/hostaway/reservations"
            : "/api/pms/hospitable/reservations",
          { headers }
        ),
        fetch(
          isHostaway
            ? "/api/pms/hostaway/financials"
            : "/api/pms/hospitable/financials",
          { headers }
        ),
      ]);

      // Process listings
      if (listRes.status === "fulfilled" && listRes.value.ok) {
        const data = await listRes.value.json();
        const raw = data.result || data.data || [];
        setListings(
          isHostaway
            ? normalizeHostawayListings(raw)
            : normalizeHospitableListings(raw)
        );
      }

      // Process reservations
      if (resRes.status === "fulfilled" && resRes.value.ok) {
        const data = await resRes.value.json();
        const raw = data.result || data.data || [];
        setReservations(
          isHostaway
            ? normalizeHostawayReservations(raw)
            : normalizeHospitableReservations(raw)
        );
      }

      // Process financials
      if (finRes.status === "fulfilled" && finRes.value.ok) {
        const data = await finRes.value.json();
        setFinancials(data.result || data.data || []);
      }

      // Check if all failed
      const allFailed =
        listRes.status === "rejected" &&
        resRes.status === "rejected" &&
        finRes.status === "rejected";

      if (allFailed) {
        setError(
          "Could not fetch data from your PMS. Your credentials may have expired."
        );
      }

      setLastSynced(new Date().toLocaleString());
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">
            Listings ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="reservations">
            Reservations ({reservations.length})
          </TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

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
