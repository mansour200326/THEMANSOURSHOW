import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Gives every browser an anonymous host id.
 *
 * The library has to know which boards a host has already been served, and
 * most hosts will never sign in — the free tier is meant to be genuinely
 * usable without an account. So a cookie stands in for the account: it isn't
 * an identity, it can't be looked up, and it's worth nothing to anybody who
 * steals it. It exists so the second board you're served isn't the first one
 * again.
 *
 * Set in middleware rather than in a route because the very first request a
 * host makes might be the one that needs it, and this is the only place that
 * runs before everything.
 */
export const ANON_COOKIE = "bn_host";

export function middleware(request: NextRequest) {
  if (request.cookies.get(ANON_COOKIE)) return NextResponse.next();

  const id = crypto.randomUUID();

  /*
   * Set on the request as well as the response.
   *
   * A cookie written only to the response isn't visible to the route handler
   * serving that same request — so the very first thing a new host did was
   * handled with no id at all, and the board they were served was never
   * recorded as seen. They'd then be offered it a second time, which is the
   * one thing the library is supposed to prevent. Rewriting the request
   * headers makes the id readable immediately, on the request that minted it.
   */
  request.cookies.set(ANON_COOKIE, id);
  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });

  response.cookies.set(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  /*
   * Everything except static files and the auth routes. Auth is excluded
   * because NextAuth sets its own cookies on those responses and there's no
   * reason to have two things writing to the same jar.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/auth).*)"],
};
