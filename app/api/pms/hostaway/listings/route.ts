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

    const res = await fetch("https://api.hostaway.com/v1/listings", {
      headers: { Authorization: `Bearer ${token}` },
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
