import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/app", "/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const tokenFromCookie =
    request.cookies.get("session")?.value ??
    request.cookies.get("__session")?.value;

  const bearer =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");

  const tokenFromHeader = bearer?.startsWith("Bearer ")
    ? bearer.slice("Bearer ".length)
    : undefined;

  const idToken = tokenFromHeader ?? tokenFromCookie;

  if (!idToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/dashboard/:path*"]
};

