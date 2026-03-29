import { NextResponse } from "next/server";
import { getGuestyToken } from "../_lib/auth";

const API_BASE = "https://open-api.guesty.com/v1";
const MAX_PAGES = 50;
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

    const fields = "_id title nickname address bedrooms accommodates propertyType active timezone";
    const allListings: any[] = [];
    let skip = 0;
    const limit = 100;

    for (let page = 0; page < MAX_PAGES; page++) {
      if (page > 0) await new Promise((r) => setTimeout(r, DELAY_MS));

      const params = new URLSearchParams({
        active: "true",
        fields,
        limit: String(limit),
        skip: String(skip),
      });

      const res = await fetch(`${API_BASE}/listings?${params.toString()}`, { headers });

      if (!res.ok) {
        const err = await res.text();
        console.log(`[Guesty Listings] Page ${page + 1} error ${res.status}: ${err}`);
        break;
      }

      const data = await res.json();
      const results = data.results || data || [];
      allListings.push(...results);

      if (results.length < limit) break;
      skip += limit;
    }

    console.log(`[Guesty Listings] Total fetched: ${allListings.length}`);

    return NextResponse.json({ result: allListings });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
