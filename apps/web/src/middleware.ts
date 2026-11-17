import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { tenantMiddleware } from "./server/tenant-middleware";
import { rateLimitMiddleware } from "./server/rate-limiter";

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  return tenantMiddleware(request, (request) => {
    const response = NextResponse.next();
    // Add additional headers or modify response as needed
    return response;
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
