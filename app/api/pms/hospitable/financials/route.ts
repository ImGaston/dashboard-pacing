import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  try {
    const res = await fetch(
      "https://api.hospitable.com/reservations?limit=500&sort=-check_in",
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const reservations = data.data || [];

    // Aggregate revenue by month from reservations
    const monthMap: Record<string, number> = {};
    const MONTHS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    for (const r of reservations) {
      const checkIn = r.check_in || r.checkin_date || r.arrival_date;
      if (!checkIn) continue;
      const date = new Date(checkIn);
      if (isNaN(date.getTime())) continue;

      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      const revenue = parseFloat(
        r.total_paid || r.host_payout || r.total_price || r.payout || "0"
      );
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
