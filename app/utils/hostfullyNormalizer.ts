import type { Reservation } from "@/types";
import { differenceInCalendarDays } from "date-fns";

// Map Hostfully source values to standard channel names
const CHANNEL_MAP: Record<string, string> = {
  DIRECT_AIRBNB: "Airbnb",
  DIRECT_VRBO: "VRBO",
  DIRECT_BOOKINGDOTCOM: "Booking.com",
  DIRECT_HOMETOGO: "HomeToGo",
  DIRECT_GOOGLE: "Google",
  DIRECT_REDAWNING: "RedAwning",
  DIRECT_HVMI: "HVMI",
  HOSTFULLY_DBS: "Direct",
  HOSTFULLY_UI: "Direct",
  HOSTFULLY_API: "Direct",
  HOSTFULLY_LINKED: "Direct",
  HOSTFULLY_OWNER_PORTAL: "Direct",
  HOSTFULLY_ICAL: "Direct",
};

/**
 * Normalize a single Hostfully lead + order into a Reservation.
 * Revenue comes from the Order object (totalAmount, in dollars).
 */
export function normalizeHostfullyToReservation(
  lead: any,
  ordersMap: Map<string, any>,
  propertiesMap: Map<string, string>
): Reservation | null {
  // Status filter — only confirmed bookings count for analytics
  const status = (lead.status || "").toUpperCase();
  const type = (lead.type || "").toUpperCase();
  if (status !== "BOOKED" || type !== "BOOKING") return null;

  // Parse dates
  const checkInStr = lead.checkInZonedDateTime || lead.checkInLocalDateTime;
  const checkOutStr = lead.checkOutZonedDateTime || lead.checkOutLocalDateTime;
  const bookingDateStr = lead.bookedUtcDateTime;

  if (!checkInStr || !bookingDateStr) return null;

  const checkInDate = new Date(checkInStr);
  const checkOutDate = checkOutStr ? new Date(checkOutStr) : checkInDate;
  const reservationDate = new Date(bookingDateStr);

  if (isNaN(checkInDate.getTime()) || isNaN(reservationDate.getTime()))
    return null;

  // Revenue from order
  const order = ordersMap.get(lead.uid);
  const revenue = order?.totalAmount || 0;
  if (!revenue || revenue <= 0) return null;

  // Nights (calculated — no direct field in Hostfully)
  const nights = differenceInCalendarDays(checkOutDate, checkInDate);
  if (nights <= 0) return null;

  // Channel normalization
  const source = (lead.source || "").toUpperCase();
  const channel = CHANNEL_MAP[source] || source.replace(/^(DIRECT_|HOSTFULLY_)/, "").charAt(0) + source.replace(/^(DIRECT_|HOSTFULLY_)/, "").slice(1).toLowerCase() || "Direct";

  // Guest name
  const firstName = lead.guestInformation?.firstName || "";
  const lastName = lead.guestInformation?.lastName || "";
  const guest = [firstName, lastName]
    .filter((n) => n && n !== "HIDDEN")
    .join(" ") || "Guest";

  // Listing name
  const listing =
    propertiesMap.get(lead.propertyUid) || `Property ${lead.propertyUid || "Unknown"}`;

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

export function normalizeAllHostfully(
  rawLeads: any[],
  ordersMap: Map<string, any>,
  propertiesMap: Map<string, string>
): Reservation[] {
  return rawLeads
    .map((lead) => normalizeHostfullyToReservation(lead, ordersMap, propertiesMap))
    .filter((r): r is Reservation => r !== null);
}

export function buildHostfullyPropertiesMap(
  rawProperties: any[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of rawProperties) {
    map.set(p.uid, p.name || `Property ${p.uid}`);
  }
  return map;
}
