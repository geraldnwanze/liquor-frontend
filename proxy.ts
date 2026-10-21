import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast gates. The shop account area needs the customer session cookie and sends visitors to the shop sign-in; the
 * admin area needs the separate staff session cookie and sends visitors to the staff portal. This only checks that a
 * cookie exists; every page still verifies the session with the API, so a forged or expired cookie gets nothing.
 */
export function proxy(request: NextRequest) {
  const staffArea = request.nextUrl.pathname.startsWith("/admin");
  if (request.cookies.has(staffArea ? "lq_staff_session" : "lq_session")) return NextResponse.next();

  const url = new URL(staffArea ? "/staff/login" : "/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/account/:path*", "/admin/:path*"] };
