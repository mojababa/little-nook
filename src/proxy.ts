import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirects based on whether a session cookie is present. They save
 * a round trip but are not the security check: every app page re-checks the
 * session on the server (src/server/session.ts).
 */
export function proxy(request: NextRequest) {
  const hasSession = getSessionCookie(request) !== null;
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    // The installed app opens on "/": take logged-in users straight in.
    return hasSession
      ? NextResponse.redirect(new URL("/home", request.url))
      : NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

// Must be literals (Next.js reads them at build time): "/" plus every entry of
// appSections in src/lib/app-sections.ts.
export const config = {
  matcher: [
    "/",
    "/home/:path*",
    "/inventory/:path*",
    "/patterns/:path*",
    "/projects/:path*",
    "/offers/:path*",
    "/finances/:path*",
    "/settings/:path*",
  ],
};
