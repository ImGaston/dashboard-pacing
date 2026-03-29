import { NextResponse } from "next/server";
import { getGuestyToken } from "../_lib/auth";

const API_BASE = "https://open-api.guesty.com/v1";
const MAX_PAGES = 100;
const DELAY_MS = 100;

export async function GET(request: Request) {
  const clientId = request.headers.get("x-guesty-client-id");
  const clientSecret = request.headers.get("x-guesty-client-secret");

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  try {
    const token = await getGuestyToken(clientId, clientSecret);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const fields = "_id checkIn checkOut checkInDateLocalized checkOutDateLocalized status nightsCount listingId source confirmationCode money guest createdAt";

    const allReservations: any[] = [];
    let skip = 0;
    const limit = 100;

    for (let page = 0; page < MAX_PAGES; page++) {
      if (page > 0) await new Promise((r) => setTimeout(r, DELAY_MS));

      // Filter: checkIn >= 2025-01-01
      const params = new URLSearchParams({
        "filters[0][field]": "checkIn",
        "filters[0][operator]": "$gte",
        "filters[0][value]": "2025-01-01T00:00:00Z",
        fields,
        limit: String(limit),
        skip: String(skip),
        sort: "checkIn",
      });

      const res = await fetch(`${API_BASE}/reservations?${params.toString()}`, { headers });

      if (!res.ok) {
        const err = await res.text();
        console.log(`[Guesty Reservations] Page ${page + 1} error ${res.status}: ${err}`);
        break;
      }

      const data = await res.json();
      const results = data.results || data || [];
      allReservations.push(...results);

      console.log(`[Guesty Reservations] Page ${page + 1}: ${results.length} reservations`);

      if (results.length < limit) break;
      skip += limit;
    }

    console.log(`[Guesty Reservations] Total fetched: ${allReservations.length}`);

    return NextResponse.json({
      data: allReservations,
      total: allReservations.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
