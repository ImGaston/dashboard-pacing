import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed =
    request.cookies.get("revfactor_auth")?.value === "authenticated";
  const adminAuthed =
    request.cookies.get("revfactor_admin_auth")?.value === "authenticated";

  if (pathname.startsWith("/dashboard") && !authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname.startsWith("/admin/course") && !adminAuthed) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (pathname === "/admin" && adminAuthed) {
    return NextResponse.redirect(new URL("/admin/course", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/admin/:path*"],
};
