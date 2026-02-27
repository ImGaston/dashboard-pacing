import { NextResponse } from "next/server";

async function getHostawayToken(accountId: string, apiKey: string) {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: accountId,
    client_secret: apiKey,
  });

  const res = await fetch("https://api.hostaway.com/v1/accessTokens", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Hostaway auth failed (${res.status})`);
  const data = await res.json();
  return data.access_token as string;
}

export async function GET(request: Request) {
  const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");
  const accountId = request.headers.get("x-account-id");

  if (!apiKey || !accountId) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  try {
    const token = await getHostawayToken(accountId, apiKey);

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
