import { NextResponse } from "next/server";

const API_BASE = "https://api.ownerrez.com/v2";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  const headers = {
    Authorization: authHeader,
    Accept: "application/json",
  };

  try {
    const allProperties: any[] = [];
    let nextUrl: string | null = `${API_BASE}/properties?active=true`;

    while (nextUrl) {
      const res: Response = await fetch(nextUrl, { headers });

      if (!res.ok) {
        const err = await res.text();
        console.log(`[OwnerRez Properties] Error ${res.status}: ${err}`);
        return NextResponse.json({ error: err }, { status: res.status });
      }

      const data = await res.json();
      const items = data.items || [];
      allProperties.push(...items);
      const rawNext = data.next_page_url || null;
      nextUrl = rawNext
        ? rawNext.startsWith("http")
          ? rawNext
          : `https://api.ownerrez.com${rawNext}`
        : null;
    }

    console.log(`[OwnerRez Properties] Fetched ${allProperties.length} properties`);

    return NextResponse.json({ data: allProperties });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
