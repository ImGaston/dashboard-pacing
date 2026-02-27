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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Hostaway auth failed (${res.status})`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(request: Request) {
  try {
    const { provider, apiKey, accountId } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { valid: false, error: "Provider and API key are required" },
        { status: 400 }
      );
    }

    if (provider === "hostaway") {
      if (!accountId) {
        return NextResponse.json(
          { valid: false, error: "Account ID is required for Hostaway" },
          { status: 400 }
        );
      }

      // Validate by attempting OAuth token exchange
      try {
        await getHostawayToken(accountId, apiKey);
        return NextResponse.json({ valid: true });
      } catch (e) {
        return NextResponse.json({
          valid: false,
          error: "Invalid Hostaway credentials. Check your Account ID and API key.",
        });
      }
    }

    if (provider === "hospitable") {
      // Validate by making a test request to list properties
      try {
        const res = await fetch("https://api.hospitable.com/properties?limit=1", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!res.ok) {
          return NextResponse.json({
            valid: false,
            error: `Invalid Hospitable API key (${res.status}).`,
          });
        }

        return NextResponse.json({ valid: true });
      } catch {
        return NextResponse.json({
          valid: false,
          error: "Could not reach Hospitable API. Check your connection.",
        });
      }
    }

    return NextResponse.json(
      { valid: false, error: "Unsupported provider" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
