import { NextResponse } from "next/server";
import { getHostawayToken } from "../_lib/auth";

export async function GET(request: Request) {
  const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");
  const accountId = request.headers.get("x-account-id");

  if (!apiKey || !accountId) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  try {
    const token = await getHostawayToken(accountId, apiKey);

    // Fetch reservations and aggregate revenue by month
    const res = await fetch(
      "https://api.hostaway.com/v1/reservations?limit=500&sortOrder=desc",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const reservations = data.result || [];

    // Aggregate revenue by month from reservations
    const monthMap: Record<string, number> = {};
    const MONTHS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    for (const r of reservations) {
      // Only include confirmed reservations (new/modified) for financials
      const status = (r.status || "").toLowerCase();
      if (status !== "new" && status !== "modified") continue;

      const checkIn = r.arrivalDate || r.checkInDate || r.startDate;
      if (!checkIn) continue;
      const date = new Date(checkIn);
      if (isNaN(date.getTime())) continue;

      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      const revenue = parseFloat(r.totalPrice || r.hostPayout || r.basePrice || "0");
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

    return NextResponse.json({ result: financials });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
