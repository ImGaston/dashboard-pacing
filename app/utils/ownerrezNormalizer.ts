import type { Reservation } from "@/types";
import { differenceInCalendarDays } from "date-fns";

const CHANNEL_MAP: Record<string, string> = {
  airbnb: "Airbnb",
  vrbo: "VRBO",
  homeaway: "VRBO",
  "booking.com": "Booking.com",
  booking: "Booking.com",
  expedia: "Expedia",
  tripadvisor: "TripAdvisor",
  direct: "Direct",
  "": "Direct",
};

/**
 * Normalize a single OwnerRez booking into a Reservation.
 * Revenue is already in dollars (no cents conversion needed).
 */
export function normalizeOwnerrezToReservation(
  raw: any,
  propertiesMap: Map<number, string>
): Reservation | null {
  // Parse dates
  const arrivalStr = raw.arrival;
  const departureStr = raw.departure;
  const bookedStr = raw.booked_utc || raw.created_utc;

  if (!arrivalStr || !bookedStr) return null;

  const checkInDate = new Date(arrivalStr);
  const checkOutDate = departureStr ? new Date(departureStr) : checkInDate;
  const reservationDate = new Date(bookedStr);

  if (isNaN(checkInDate.getTime()) || isNaN(reservationDate.getTime()))
    return null;

  // Revenue — already in dollars
  const revenue = raw.total_amount || 0;
  if (!revenue || revenue <= 0) return null;

  // Nights
  let nights = differenceInCalendarDays(checkOutDate, checkInDate);
  if (nights <= 0) return null;

  // Skip owner blocks
  if (raw.is_block) return null;

  // Status filter — skip canceled
  const status = (raw.status || "").toLowerCase();
  if (status === "canceled") return null;

  // Channel
  const rawChannel = (raw.listing_site || "").toLowerCase().trim();
  const channel =
    CHANNEL_MAP[rawChannel] ||
    rawChannel.charAt(0).toUpperCase() + rawChannel.slice(1) ||
    "Direct";

  // Guest name
  const firstName = raw.guest?.first_name || "";
  const lastName = raw.guest?.last_name || "";
  const guest = [firstName, lastName].filter(Boolean).join(" ") || "Guest";

  // Listing name from properties map
  const propId = raw.property_id;
  const listing =
    (propId && propertiesMap.get(Number(propId))) ||
    raw.property?.external_name ||
    raw.property?.name ||
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

export function normalizeAllOwnerrez(
  rawBookings: any[],
  propertiesMap: Map<number, string>
): Reservation[] {
  return rawBookings
    .map((b) => normalizeOwnerrezToReservation(b, propertiesMap))
    .filter((r): r is Reservation => r !== null);
}

export function buildOwnerrezPropertiesMap(
  rawProperties: any[]
): Map<number, string> {
  const map = new Map<number, string>();
  for (const p of rawProperties) {
    map.set(
      Number(p.id),
      p.external_name || p.name || `Property ${p.id}`
    );
  }
  return map;
}
