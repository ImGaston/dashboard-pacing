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
    const { provider, apiKey, accountId, email } = await request.json();

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
        const res = await fetch("https://public.api.hospitable.com/v2/properties?per_page=1", {
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

    if (provider === "ownerrez") {
      if (!email) {
        return NextResponse.json({
          valid: false,
          error: "Email is required for OwnerRez.",
        });
      }

      // OwnerRez uses HTTP Basic Auth: base64(email:apiToken)
      try {
        const basicAuth = Buffer.from(`${email}:${apiKey}`).toString("base64");
        const res = await fetch("https://api.ownerrez.com/v2/users/me", {
          headers: { Authorization: `Basic ${basicAuth}` },
        });

        if (!res.ok) {
          return NextResponse.json({
            valid: false,
            error: `Invalid OwnerRez credentials (${res.status}).`,
          });
        }

        return NextResponse.json({ valid: true });
      } catch {
        return NextResponse.json({
          valid: false,
          error: "Could not reach OwnerRez API. Check your connection.",
        });
      }
    }

    if (provider === "hostfully") {
      // Validate by fetching agencies with the API key
      try {
        const res = await fetch("https://platform.hostfully.com/api/v3/agencies", {
          headers: {
            "X-HOSTFULLY-APIKEY": apiKey,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          return NextResponse.json({
            valid: false,
            error: `Invalid Hostfully API key (${res.status}).`,
          });
        }

        const data = await res.json();
        // Return the agencyUid so the client can store it
        const agencies = data.agencies || data || [];
        const agencyUid = Array.isArray(agencies) ? agencies[0]?.uid : agencies.uid;

        return NextResponse.json({ valid: true, agencyUid });
      } catch {
        return NextResponse.json({
          valid: false,
          error: "Could not reach Hostfully API. Check your connection.",
        });
      }
    }

    if (provider === "guesty") {
      if (!accountId) {
        return NextResponse.json({
          valid: false,
          error: "Client ID is required for Guesty.",
        });
      }

      // Validate by attempting OAuth token exchange
      try {
        const body = new URLSearchParams({
          grant_type: "client_credentials",
          scope: "open-api",
          client_id: accountId,
          client_secret: apiKey,
        });

        const res = await fetch("https://open-api.guesty.com/oauth2/token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        if (!res.ok) {
          return NextResponse.json({
            valid: false,
            error: `Invalid Guesty credentials (${res.status}). Check your Client ID and Secret.`,
          });
        }

        return NextResponse.json({ valid: true });
      } catch {
        return NextResponse.json({
          valid: false,
          error: "Could not reach Guesty API. Check your connection.",
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
