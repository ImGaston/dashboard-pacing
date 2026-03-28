import { NextResponse } from "next/server";

const API_BASE = "https://public.api.hospitable.com/v2";
const MAX_PAGES = 50;

export async function GET(request: Request) {
  const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  try {
    // Step 1: Fetch all property IDs (required by the reservations endpoint)
    const propertyIds: string[] = [];
    let propsUrl: string | null = `${API_BASE}/properties?per_page=100`;

    while (propsUrl) {
      const propsRes: Response = await fetch(propsUrl, { headers });
      if (!propsRes.ok) break;
      const propsData = await propsRes.json();
      const batch = propsData.data || [];
      for (const p of batch) {
        if (p.id) propertyIds.push(p.id);
      }
      propsUrl = propsData.links?.next || null;
    }

    if (propertyIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Step 2: Fetch all reservations with date range + financials
    const propertiesParam = propertyIds
      .map((id) => `properties[]=${encodeURIComponent(id)}`)
      .join("&");

    const queryParams = [
      propertiesParam,
      "start_date=2025-01-01",
      "end_date=2026-12-31",
      "date_query=checkin",
      "status[]=accepted",
      "include=financials",
      "per_page=100",
      "page=1",
    ].join("&");

    const allReservations: any[] = [];
    let nextUrl: string | null = `${API_BASE}/reservations?${queryParams}`;
    let pages = 0;

    while (nextUrl && pages < MAX_PAGES) {
      if (pages > 0) {
        await new Promise((r) => setTimeout(r, 5000));
      }
      const res: Response = await fetch(nextUrl, { headers });
      if (!res.ok) break;
      const data = await res.json();
      const batch = data.data || [];
      allReservations.push(...batch);
      nextUrl = data.links?.next || null;
      pages++;
    }

    // Step 3: Aggregate revenue by month
    const monthMap: Record<string, number> = {};
    const MONTHS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    for (const r of allReservations) {
      const checkIn = r.check_in || r.arrival_date;
      if (!checkIn) continue;
      const date = new Date(checkIn);
      if (isNaN(date.getTime())) continue;

      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

      // Hospitable amounts are in CENTS — divide by 100
      const cents =
        r.financials?.host?.revenue?.amount ??
        r.financials?.host?.accommodation?.amount ??
        r.financials?.guest?.total_price?.amount ??
        0;
      const revenue = (typeof cents === "number" ? cents : parseFloat(String(cents))) / 100;

      monthMap[key] = (monthMap[key] || 0) + revenue;
    }

    // Sort by date and return last 12 months
    const financials = Object.entries(monthMap)
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => {
        const [am, ay] = a.month.split(" ");
        const [bm, by] = b.month.split(" ");
        const aIdx = MONTHS.indexOf(am) + parseInt(ay) * 12;
        const bIdx = MONTHS.indexOf(bm) + parseInt(by) * 12;
        return aIdx - bIdx;
      })
      .slice(-12);

    return NextResponse.json({ data: financials });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
