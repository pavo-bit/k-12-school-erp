import { NextRequest, NextResponse } from "next/server";
import { buildTenantContext } from "./tenant-middleware";

/**
 * Context object passed to API route handlers
 */
export interface TenantApiContext {
  schoolSlug: string;
  schoolId: string;
  requestId: string;
  tenantContext: Awaited<ReturnType<typeof buildTenantContext>>;
}

/**
 * Creates a tenant API context from a NextRequest
 * Should be called at the beginning of each API route handler
 */
export async function createTenantContext(request: NextRequest): Promise<TenantApiContext> {
  const context = await buildTenantContext(request);

  return {
    schoolSlug: context.schoolSlug,
    schoolId: context.schoolId,
    requestId: context.requestId,
    tenantContext: context,
  };
}

/**
 * Gets the current tenant ID from request headers
 * @deprecated Use createTenantContext instead
 */
export function getTenantIdFromRequest(request: NextRequest): string | null {
  return request.headers.get("x-tenant-id") || null;
}

/**
 * Gets the current request ID from request headers
 */
export function getRequestIdFromRequest(request: NextRequest): string | null {
  return request.headers.get("x-request-id") || null;
}

/**
 * Validates that a request has a valid tenant context
 */
export function hasValidTenantContext(request: NextRequest): boolean {
  const tenantId = getTenantIdFromRequest(request);
  const requestId = getRequestIdFromRequest(request);

  return tenantId !== null && requestId !== null;
}

/**
 * Creates a standardized API response with tenant context
 */
export function createTenantAwareResponse(
  data: any,
  request: NextRequest,
  status: number = 200,
): NextResponse {
  const response = NextResponse.json(data, { status });

  // Add tenant context to response headers for debugging
  response.headers.set("x-tenant-id", getTenantIdFromRequest(request) || "unknown");
  response.headers.set("x-request-id", getRequestIdFromRequest(request) || "unknown");
  response.headers.set("x-school-slug", getSchoolSlugFromRequest(request) || "unknown");

  return response;
}

/**
 * Gets the school slug from request headers
 */
export function getSchoolSlugFromRequest(request: NextRequest): string | null {
  const slug = request.headers.get("x-school-slug");
  return slug === (process.env.DEFAULT_SCHOOL_SLUG || "greenwood") ? null : slug;
}

/**
 * Validates that a request has the correct origin
 */
export function isValidOrigin(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const originHeader = request.headers.get("x-origin-secret");
  const expectedSecret = process.env.CLOUDFLARE_ORIGIN_SECRET;

  return originHeader === expectedSecret;
}

/**
 * Wraps an API handler to ensure tenant context is available
 * and origin is validated
 */
export async function withTenantContext<T extends Record<string, unknown>>(
  request: NextRequest,
  handler: (ctx: TenantApiContext) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  // Validate origin first
  if (!isValidOrigin(request)) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Direct access to this endpoint is not allowed. Please use the configured domain.",
        },
      },
      { status: 403 },
    );
  }

  // Build tenant context
  const tenantContext = await createTenantContext(request);

  // Call handler with context
  try {
    return await handler(tenantContext);
  } catch (error) {
    console.error("Error in withTenantContext:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          requestId: tenantContext.requestId,
        },
      },
      { status: 500 },
    );
  }
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

/**
 * Creates a success response
 */
export function successResponse<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    data,
  };
}

/**
 * Creates an error response
 */
export function errorResponse(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown,
): ApiResponse {
  return {
    error: {
      code,
      message,
      requestId,
      details,
    },
  };
}
