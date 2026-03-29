import { NextResponse } from "next/server";

const API_BASE = "https://platform.hostfully.com/api/v3";

export async function GET(request: Request) {
  const apiKey = request.headers.get("x-hostfully-apikey");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/agencies`, {
      headers: {
        "X-HOSTFULLY-APIKEY": apiKey,
        "Content-Type": "application/json",
      },
    });

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
