import { NextResponse } from "next/server";

const API_BASE = "https://public.api.hospitable.com/v2";
const MAX_PAGES = 200;
const DELAY_MS = 3000; // delay between paginated requests

export async function GET(request: Request) {
  const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  const url = new URL(request.url);

  try {
    // Use property IDs from query params if provided (avoids extra API call)
    let propertyIds = url.searchParams.getAll("properties[]");

    if (propertyIds.length === 0) {
      // Fallback: fetch property IDs from API
      let propsUrl: string | null = `${API_BASE}/properties?per_page=100`;
      while (propsUrl) {
        const propsRes: Response = await fetch(propsUrl, { headers });
        if (!propsRes.ok) break;
        const propsData = await propsRes.json();
        const batch = propsData.data || [];
        propertyIds.push(...batch.map((p: any) => p.id));
        propsUrl = propsData.links?.next || null;
      }
    }

    console.log(`[Hospitable Reservations] Using ${propertyIds.length} properties`);

    if (propertyIds.length === 0) {
      return NextResponse.json({ data: [], total: 0 });
    }

    // Build base query (without page number)
    const propsParam = propertyIds
      .map((id) => `properties[]=${encodeURIComponent(id)}`)
      .join("&");

    const baseQuery = [
      propsParam,
      "start_date=2025-01-01",
      "end_date=2026-12-31",
      "date_query=checkin",
      "status[]=accepted",
      "status[]=request",
      "status[]=cancelled",
      "include=financials,guest,properties,listings",
      "per_page=100",
    ].join("&");

    // Paginate by constructing URLs ourselves (don't rely on links.next)
    const allReservations: any[] = [];
    let page = 1;
    let lastPage = 1;

    while (page <= lastPage && page <= MAX_PAGES) {
      if (page > 1) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }

      const pageUrl = `${API_BASE}/reservations?${baseQuery}&page=${page}`;
      let res: Response = await fetch(pageUrl, { headers });

      // Retry once on 401/429 after a longer wait
      if (!res.ok && (res.status === 401 || res.status === 429) && page > 1) {
        console.log(`[Hospitable Reservations] Page ${page} got ${res.status}, retrying in 10s...`);
        await new Promise((r) => setTimeout(r, 10000));
        res = await fetch(pageUrl, { headers });
      }

      if (!res.ok) {
        const err = await res.text();
        console.log(`[Hospitable Reservations] Page ${page} error ${res.status}: ${err}`);
        break;
      }

      const data = await res.json();
      const batch = data.data || [];
      const meta = data.meta || {};

      // Update lastPage from API response
      if (meta.last_page) {
        lastPage = meta.last_page;
      }

      allReservations.push(...batch);
      console.log(`[Hospitable Reservations] Page ${page}/${lastPage}: ${batch.length} items (total: ${allReservations.length}/${meta.total || "?"})`);

      page++;
    }

    console.log(`[Hospitable Reservations] Done: ${allReservations.length} reservations in ${page - 1} pages`);

    return NextResponse.json({
      data: allReservations,
      total: allReservations.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    console.log(`[Hospitable Reservations] Network error: ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
