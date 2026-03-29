import { NextResponse } from "next/server";

const API_BASE = "https://platform.hostfully.com/api/v3";
const MAX_PAGES = 100;
const DELAY_MS = 150;

export async function GET(request: Request) {
  const apiKey = request.headers.get("x-hostfully-apikey");
  const { searchParams } = new URL(request.url);
  const agencyUid = searchParams.get("agencyUid");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }
  if (!agencyUid) {
    return NextResponse.json({ error: "Missing agencyUid" }, { status: 400 });
  }

  const headers = {
    "X-HOSTFULLY-APIKEY": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const allLeads: any[] = [];
    let cursor: string | null = null;
    let page = 0;

    while (page < MAX_PAGES) {
      if (page > 0) await new Promise((r) => setTimeout(r, DELAY_MS));

      const params = new URLSearchParams({
        agencyUid,
        checkInFrom: "2025-01-01",
        checkInTo: "2026-12-31",
        _limit: "100",
      });
      if (cursor) params.set("_cursor", cursor);

      const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers });

      if (!res.ok) {
        const err = await res.text();
        console.log(`[Hostfully Reservations] Page ${page + 1} error ${res.status}: ${err}`);
        break;
      }

      const data = await res.json();
      const leads = data.leads || [];
      allLeads.push(...leads);

      console.log(`[Hostfully Reservations] Page ${page + 1}: ${leads.length} leads`);

      cursor = data._paging?._nextCursor || null;
      if (!cursor) break;
      page++;
    }

    console.log(`[Hostfully Reservations] Total fetched: ${allLeads.length} leads`);

    return NextResponse.json({
      data: allLeads,
      total: allLeads.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
