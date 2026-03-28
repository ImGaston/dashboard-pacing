import type { Reservation } from "@/types";
import { differenceInCalendarDays } from "date-fns";

const CHANNEL_MAP: Record<string, string> = {
  airbnb: "Airbnb",
  vrbo: "VRBO",
  homeaway: "VRBO",
  "booking.com": "Booking.com",
  booking: "Booking.com",
  direct: "Direct",
  expedia: "Expedia",
  tripadvisor: "TripAdvisor",
};

/**
 * Extract revenue in DOLLARS from a Hospitable reservation.
 * Hospitable stores all monetary amounts in **cents** (12345 = $123.45).
 */
function extractRevenue(raw: any): number {
  // Try host revenue first (most accurate), then accommodation, then guest total
  const hostRevenue = raw.financials?.host?.revenue?.amount;
  const hostAccomm = raw.financials?.host?.accommodation?.amount;
  const guestTotal = raw.financials?.guest?.total_price?.amount;
  const guestAccomm = raw.financials?.guest?.accommodation?.amount;

  // Sum guest payments as last fallback
  const guestPayments = raw.financials?.guest?.payments;
  const paymentsTotal =
    Array.isArray(guestPayments)
      ? guestPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      : 0;

  const cents =
    (hostRevenue && hostRevenue > 0 ? hostRevenue : null) ??
    (hostAccomm && hostAccomm > 0 ? hostAccomm : null) ??
    (guestTotal && guestTotal > 0 ? guestTotal : null) ??
    (guestAccomm && guestAccomm > 0 ? guestAccomm : null) ??
    (paymentsTotal > 0 ? paymentsTotal : 0);

  return typeof cents === "number" ? cents / 100 : parseFloat(String(cents)) / 100;
}

export function normalizeHospitableToReservation(
  raw: any,
  propertiesMap: Map<string, string>
): Reservation | null {
  // Parse dates
  const checkInStr = raw.check_in || raw.arrival_date;
  const checkOutStr = raw.check_out || raw.departure_date;
  const bookingDateStr = raw.booking_date;

  if (!checkInStr || !bookingDateStr) return null;

  const checkInDate = new Date(checkInStr);
  const checkOutDate = checkOutStr ? new Date(checkOutStr) : checkInDate;
  const reservationDate = new Date(bookingDateStr);

  if (isNaN(checkInDate.getTime()) || isNaN(reservationDate.getTime()))
    return null;

  // Revenue (cents → dollars)
  const revenue = extractRevenue(raw);
  if (!revenue || revenue <= 0) return null;

  // Nights
  let nights = raw.nights ? parseInt(String(raw.nights)) : 0;
  if (!nights || nights <= 0) {
    nights = differenceInCalendarDays(checkOutDate, checkInDate);
  }
  if (nights <= 0) return null;

  // Status filter — only confirmed reservations count for analytics
  const statusCategory = (
    raw.reservation_status?.current?.category || raw.status || ""
  ).toLowerCase();
  if (statusCategory !== "accepted") return null;

  // Channel normalization
  const rawChannel = (raw.platform || "direct").toLowerCase().trim();
  const channel =
    CHANNEL_MAP[rawChannel] ||
    rawChannel.charAt(0).toUpperCase() + rawChannel.slice(1);

  // Guest name
  const firstName = raw.guest?.first_name || "";
  const lastName = raw.guest?.last_name || "";
  const guest = [firstName, lastName].filter(Boolean).join(" ") || "Guest";

  // Listing / property name from the properties map or inline data
  const propertyId = raw.properties?.[0]?.id;
  const listing =
    (propertyId && propertiesMap.get(String(propertyId))) ||
    raw.properties?.[0]?.name ||
    raw.properties?.[0]?.public_name ||
    "Unknown";

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

export function normalizeAllHospitable(
  rawReservations: any[],
  propertiesMap: Map<string, string>
): Reservation[] {
  return rawReservations
    .map((r) => normalizeHospitableToReservation(r, propertiesMap))
    .filter((r): r is Reservation => r !== null);
}

export function buildHospitablePropertiesMap(
  rawProperties: any[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of rawProperties) {
    map.set(String(p.id), p.name || p.public_name || `Property ${p.id}`);
  }
  return map;
}
