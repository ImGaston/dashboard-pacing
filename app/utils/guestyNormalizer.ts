import type { Reservation } from "@/types";

// Map Guesty source values to standard channel names
const CHANNEL_MAP: Record<string, string> = {
  airbnb2: "Airbnb",
  airbnb: "Airbnb",
  bookingcom: "Booking.com",
  "booking.com": "Booking.com",
  homeaway2: "VRBO",
  homeaway: "VRBO",
  vrbo: "VRBO",
  tripadvisor: "TripAdvisor",
  rentalsunited: "Rentals United",
  manual: "Direct",
  direct: "Direct",
  website: "Direct",
};

/**
 * Normalize a single Guesty reservation into a Reservation.
 * Revenue from money.hostPayout (in dollars, NOT cents).
 */
export function normalizeGuestyToReservation(
  raw: any,
  listingsMap: Map<string, string>
): Reservation | null {
  // Status filter — only confirmed/closed reservations count for analytics
  const status = (raw.status || "").toLowerCase();
  if (status !== "confirmed" && status !== "closed") return null;

  // Parse dates
  const checkInStr = raw.checkInDateLocalized || raw.checkIn;
  const checkOutStr = raw.checkOutDateLocalized || raw.checkOut;
  const bookingDateStr = raw.createdAt;

  if (!checkInStr || !bookingDateStr) return null;

  const checkInDate = new Date(checkInStr);
  const checkOutDate = checkOutStr ? new Date(checkOutStr) : checkInDate;
  const reservationDate = new Date(bookingDateStr);

  if (isNaN(checkInDate.getTime()) || isNaN(reservationDate.getTime()))
    return null;

  // Revenue from money object
  const revenue = raw.money?.hostPayout || raw.money?.fareAccommodation || raw.money?.subTotalPrice || 0;
  if (!revenue || revenue <= 0) return null;

  // Nights (provided by Guesty)
  const nights = raw.nightsCount || 0;
  if (nights <= 0) return null;

  // Channel normalization
  const rawSource = (raw.source || "direct").toLowerCase().trim();
  const channel =
    CHANNEL_MAP[rawSource] ||
    rawSource.charAt(0).toUpperCase() + rawSource.slice(1);

  // Guest name
  const guest = raw.guest?.fullName || raw.guest?.firstName || "Guest";

  // Listing name from map
  const listing =
    listingsMap.get(raw.listingId) || `Listing ${raw.listingId || "Unknown"}`;

  return {
    guest,
    channel,
    checkInDate,
    checkOutDate,
    listing,
    reservationDate,
    revenue,
    nights,
  };
}

export function normalizeAllGuesty(
  rawReservations: any[],
  listingsMap: Map<string, string>
): Reservation[] {
  return rawReservations
    .map((r) => normalizeGuestyToReservation(r, listingsMap))
    .filter((r): r is Reservation => r !== null);
}

export function buildGuestyListingsMap(
  rawListings: any[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const l of rawListings) {
    map.set(l._id, l.nickname || l.title || `Listing ${l._id}`);
  }
  return map;
}
