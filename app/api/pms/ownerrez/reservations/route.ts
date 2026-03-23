import { NextResponse } from "next/server";

const API_BASE = "https://api.ownerrez.com/v2";
const MAX_PAGES = 200;
const DELAY_MS = 300; // OwnerRez docs suggest 200-500ms between requests

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  const headers = {
    Authorization: authHeader,
    Accept: "application/json",
  };

  try {
    // Step 1: Fetch all property IDs
    const propertyIds: number[] = [];
    let propsUrl: string | null = `${API_BASE}/properties?active=true`;

    while (propsUrl) {
      const res: Response = await fetch(propsUrl, { headers });
      if (!res.ok) break;
      const data = await res.json();
      const items = data.items || [];
      propertyIds.push(...items.map((p: any) => p.id));
      const rawNext = data.next_page_url || null;
      propsUrl = rawNext
        ? rawNext.startsWith("http")
          ? rawNext
          : `https://api.ownerrez.com${rawNext}`
        : null;
    }

    console.log(`[OwnerRez Reservations] Found ${propertyIds.length} properties`);

    if (propertyIds.length === 0) {
      return NextResponse.json({ data: [], total: 0 });
    }

    const propertyIdsStr = propertyIds.join(",");

    // Step 2: Fetch bookings for all statuses across 2025-2026
    // "from" = departure on or after, "to" = arrival on or before
    const allBookings: any[] = [];
    const statuses = ["Active", "Pending", "Canceled"];

    for (const status of statuses) {
      const baseParams = new URLSearchParams({
        property_ids: propertyIdsStr,
        from: "2025-01-01",
        to: "2026-12-31",
        status,
        include_charges: "true",
        include_guest: "true",
      });

      let page = 0;
      let nextUrl: string | null = `${API_BASE}/bookings?${baseParams.toString()}`;

      while (nextUrl && page < MAX_PAGES) {
        if (page > 0) {
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }

        const res: Response = await fetch(nextUrl, { headers });

        if (!res.ok) {
          const err = await res.text();
          console.log(`[OwnerRez Reservations] ${status} page ${page + 1} error ${res.status}: ${err}`);
          break;
        }

        const data = await res.json();
        const items = data.items || [];

        // Filter out owner blocks (not guest reservations)
        const guestBookings = items.filter((b: any) => !b.is_block);
        allBookings.push(...guestBookings);

        console.log(
          `[OwnerRez Reservations] ${status} page ${page + 1}: ${items.length} items (${guestBookings.length} guest bookings)`
        );

        // next_page_url can be relative (/v2/...) — ensure it's absolute
        const rawNext = data.next_page_url || null;
        nextUrl = rawNext
          ? rawNext.startsWith("http")
            ? rawNext
            : `https://api.ownerrez.com${rawNext}`
          : null;
        page++;
      }
    }

    console.log(`[OwnerRez Reservations] Total fetched: ${allBookings.length} bookings`);

    return NextResponse.json({
      data: allBookings,
      total: allBookings.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    console.log(`[OwnerRez Reservations] Network error: ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
