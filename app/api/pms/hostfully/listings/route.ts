import { NextResponse } from "next/server";

const API_BASE = "https://platform.hostfully.com/api/v3";
const MAX_PAGES = 50;
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
    const allProperties: any[] = [];
    let cursor: string | null = null;
    let page = 0;

    while (page < MAX_PAGES) {
      if (page > 0) await new Promise((r) => setTimeout(r, DELAY_MS));

      const params = new URLSearchParams({
        agencyUid,
        _limit: "100",
      });
      if (cursor) params.set("_cursor", cursor);

      const res = await fetch(`${API_BASE}/properties?${params.toString()}`, { headers });

      if (!res.ok) {
        const err = await res.text();
        console.log(`[Hostfully Listings] Page ${page + 1} error ${res.status}: ${err}`);
        break;
      }

      const data = await res.json();
      const properties = data.properties || [];
      allProperties.push(...properties);

      cursor = data._paging?._nextCursor || null;
      if (!cursor) break;
      page++;
    }

    return NextResponse.json({ result: allProperties });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
