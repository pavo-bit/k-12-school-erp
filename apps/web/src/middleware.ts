import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "./server/rate-limiter";

/**
 * Edge-safe request middleware.
 *
 * This runs in the Edge runtime, so it must NOT touch the database (pg).
 * Tenant resolution against Postgres happens in the Node runtime inside the
 * route handlers via `withApi` / `./server/tenant`.
 */

function resolveSchoolSlug(request: NextRequest): string {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const subdomain = hostname.split(".")[0] ?? "";
  if (subdomain && subdomain !== "localhost" && subdomain !== "127") {
    return subdomain;
  }
  return url.searchParams.get("school") ?? process.env.DEFAULT_SCHOOL_SLUG ?? "greenwood";
}

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const schoolSlug = resolveSchoolSlug(request);

  // Apply rate limiting to API routes — auth endpoints get a tight bucket
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const isAuth = request.nextUrl.pathname.startsWith("/api/v1/auth/");
    const rateLimitResponse = isAuth
      ? rateLimitMiddleware(request, 10, 60_000) // 10 req/min per IP on login/reset
      : rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-tenant-slug", schoolSlug);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
