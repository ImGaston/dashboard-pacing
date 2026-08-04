import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// One year — "enter the password once" per browser.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const isAdmin = body?.scope === "admin";

  // Prefer server-only vars; fall back to the legacy NEXT_PUBLIC_ names so
  // existing Vercel env config keeps working without changes.
  const expected = isAdmin
    ? process.env.ADMIN_PASSWORD ?? process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    : process.env.EVENT_PASSWORD ?? process.env.NEXT_PUBLIC_EVENT_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(isAdmin ? "revfactor_admin_auth" : "revfactor_auth", "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
