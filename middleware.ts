import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes qui appartiennent au dashboard (protégées ou non)
const DASHBOARD_PATHS = ["/articles", "/pages", "/calendar", "/org"];

// Routes qui nécessitent une session active
const PROTECTED_PATHS = ["/app", "/dashboard", "/articles", "/pages", "/calendar", "/org"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirige les routes dashboard vers elles-mêmes (force le bon layout)
  // Next.js résout le conflit (dashboard) vs (public)/[slug] via le matcher
  const isDashboard = DASHBOARD_PATHS.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  const isProtected = PROTECTED_PATHS.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected) {
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
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/articles/:path*",
    "/articles",
    "/pages/:path*",
    "/pages",
    "/calendar/:path*",
    "/calendar",
    "/org/:path*",
  ],
};
