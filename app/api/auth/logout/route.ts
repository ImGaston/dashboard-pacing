import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const isAdmin = body?.scope === "admin";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(isAdmin ? "revfactor_admin_auth" : "revfactor_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
