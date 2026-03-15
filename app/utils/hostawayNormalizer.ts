import type { Reservation } from "@/types";
import { differenceInCalendarDays } from "date-fns";

// Same channel map as csvParser.ts PMS_PARSERS.hostaway.channelMap
const CHANNEL_MAP: Record<string, string> = {
  airbnbofficial: "Airbnb",
  airbnb: "Airbnb",
  vrbo: "VRBO",
  homeaway: "VRBO",
  direct: "Direct",
  bookingengine: "Direct",
  "booking.com": "Booking.com",
  expedia: "Expedia",
};

export function normalizeHostawayToReservation(
  raw: any,
  listingsMap: Map<number, string>
): Reservation | null {
  // Parse dates
  const checkInStr = raw.arrivalDate || raw.checkInDate;
  const checkOutStr = raw.departureDate || raw.checkOutDate;
  const bookingDateStr = raw.reservationDate;

  if (!checkInStr || !bookingDateStr) return null;

  const checkInDate = new Date(checkInStr);
  const checkOutDate = checkOutStr ? new Date(checkOutStr) : checkInDate;
  const reservationDate = new Date(bookingDateStr);

  if (isNaN(checkInDate.getTime()) || isNaN(reservationDate.getTime()))
    return null;

  // Revenue
  const revenue = parseFloat(
    String(raw.totalPrice || raw.airbnbExpectedPayoutAmount || raw.hostPayout || raw.basePrice || "0")
  );
  if (!revenue || revenue <= 0) return null;

  // Nights
  let nights = raw.nights ? parseInt(String(raw.nights)) : 0;
  if (!nights || nights <= 0) {
    nights = differenceInCalendarDays(checkOutDate, checkInDate);
  }
  if (nights <= 0) return null;

  // Status filter
  const status = (raw.status || "").toLowerCase();
  if (status === "cancelled" || status === "canceled") return null;

  // Channel normalization
  const rawChannel = (raw.channelName || raw.source || "direct")
    .toLowerCase()
    .trim();
  const channel =
    CHANNEL_MAP[rawChannel] ||
    rawChannel.charAt(0).toUpperCase() + rawChannel.slice(1);

  // Listing name from listings map
  const listingMapId = raw.listingMapId || raw.listingId;
  const listing =
    listingsMap.get(listingMapId) || `Listing ${listingMapId || "Unknown"}`;

  return {
    guest: raw.guestName || raw.guestFirstName || "Guest",
    channel,
    checkInDate,
    checkOutDate,
    listing,
    reservationDate,
    revenue,
    nights,
  };
}

export function normalizeAllHostaway(
  rawReservations: any[],
  listingsMap: Map<number, string>
): Reservation[] {
  return rawReservations
    .map((r) => normalizeHostawayToReservation(r, listingsMap))
    .filter((r): r is Reservation => r !== null);
}

export function buildListingsMap(
  rawListings: any[]
): Map<number, string> {
  const map = new Map<number, string>();
  for (const l of rawListings) {
    map.set(l.id, l.internalListingName || l.name || `Listing ${l.id}`);
  }
  return map;
}
