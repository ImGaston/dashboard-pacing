import { NextResponse } from "next/server";

const API_BASE = "https://platform.hostfully.com/api/v3";
const DELAY_MS = 100;

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-hostfully-apikey");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const headers = {
    "X-HOSTFULLY-APIKEY": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const { leadUids } = await request.json();

    if (!Array.isArray(leadUids) || leadUids.length === 0) {
      return NextResponse.json({ error: "leadUids array required" }, { status: 400 });
    }

    const ordersMap: Record<string, any> = {};
    let fetched = 0;

    for (const leadUid of leadUids) {
      if (fetched > 0 && fetched % 10 === 0) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }

      try {
        const res = await fetch(
          `${API_BASE}/orders?leadUid=${encodeURIComponent(leadUid)}`,
          { headers }
        );

        if (res.ok) {
          const data = await res.json();
          const orders = data.orders || [];
          if (orders.length > 0) {
            ordersMap[leadUid] = orders[0]; // typically one order per lead
          }
        }
      } catch {
        // skip failed individual order fetches
      }
      fetched++;
    }

    console.log(`[Hostfully Orders] Fetched orders for ${Object.keys(ordersMap).length}/${leadUids.length} leads`);

    return NextResponse.json({ data: ordersMap });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
