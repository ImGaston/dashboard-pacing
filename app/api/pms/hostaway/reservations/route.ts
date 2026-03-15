import { NextResponse } from "next/server";
import { getHostawayToken } from "../_lib/auth";

export async function GET(request: Request) {
  const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");
  const accountId = request.headers.get("x-account-id");

  if (!apiKey || !accountId) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const paginate = url.searchParams.get("all") === "true";

  try {
    const token = await getHostawayToken(accountId, apiKey);

    if (paginate) {
      // Paginated fetch: get ALL reservations within date range
      const allReservations: any[] = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
          sortOrder: "desc",
        });
        if (startDate) params.set("arrivalDateStart", startDate);
        if (endDate) params.set("arrivalDateEnd", endDate);

        const res = await fetch(
          `https://api.hostaway.com/v1/reservations?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          const err = await res.text();
          return NextResponse.json({ error: err }, { status: res.status });
        }

        const data = await res.json();
        const batch = data.result || [];
        allReservations.push(...batch);

        if (batch.length < limit) break;
        offset += limit;
      }

      return NextResponse.json({
        result: allReservations,
        total: allReservations.length,
      });
    }

    // Default: single page (backward compatible)
    const res = await fetch(
      "https://api.hostaway.com/v1/reservations?limit=100&sortOrder=desc",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
