import { NextRequest, NextResponse } from "next/server";
import { db, schools } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Tenant resolution context stored in request headers
 */
export const TENANT_HEADER = "x-tenant-id";
export const TENANT_ERROR_HEADER = "x-tenant-error";
export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Resolves school slug from request
 * Priority: subdomain > query parameter > default
 */
export function resolveSchoolSlug(request: NextRequest): string {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const subdomain = hostname.split(".")[0] ?? "";

  // Default to a fallback slug if no subdomain
  if (subdomain && subdomain !== "localhost" && subdomain !== "127.0.0.1") {
    return subdomain;
  }

  // Check query parameter as fallback
  const fromQuery = url.searchParams.get("school");
  if (fromQuery) {
    return fromQuery;
  }

  // Default fallback for development
  return process.env.DEFAULT_SCHOOL_SLUG || "greenwood";
}

/**
 * Resolves school ID from request
 * Throws error if school not found
 */
export async function resolveSchoolId(request: NextRequest): Promise<string> {
  const slug = resolveSchoolSlug(request);
  const rows = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.slug, slug))
    .limit(1);

  if (rows.length === 0) {
    throw new Error(`School with slug "${slug}" not found`);
  }

  return rows[0]!.id;
}

/**
 * Validates that the request comes from the expected origin
 * This prevents direct Cloud Run URL access
 */
export function validateOrigin(request: NextRequest): boolean {
  const originHeader = request.headers.get("x-origin-secret");
  const expectedSecret = process.env.CLOUDFLARE_ORIGIN_SECRET;

  // Allow direct access in development or if secret is set
  if (process.env.NODE_ENV === "development" || !expectedSecret) {
    return true;
  }

  // In production, validate the secret header
  return originHeader === expectedSecret;
}

/**
 * Creates a tenant context object from request
 */
export interface TenantContext {
  schoolSlug: string;
  schoolId: string;
  requestId: string;
}

/**
 * Builds tenant context for a request
 */
export async function buildTenantContext(request: NextRequest): Promise<TenantContext> {
  const requestId = crypto.randomUUID();

  // Set request ID in response headers
  const response = NextResponse.next();
  response.headers.set(REQUEST_ID_HEADER, requestId);

  // Set request ID in response headers
  const tenantId = await resolveSchoolId(request);
  response.headers.set(TENANT_HEADER, tenantId);

  return {
    schoolSlug: resolveSchoolSlug(request),
    schoolId: tenantId,
    requestId,
  };
}

/**
 * Middleware to add tenant context to all requests
 * Must be used in middleware.ts
 */
export function tenantMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => NextResponse,
): NextResponse {
  // Set request ID
  const requestId = crypto.randomUUID();

  // Add request ID to response
  const response = handler(request);
  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}

/**
 * Error handler for tenant resolution failures
 */
export function handleTenantError(error: Error, slug: string): NextResponse {
  const response = NextResponse.json(
    {
      error: {
        code: "TENANT_NOT_FOUND",
        message: `School with slug "${slug}" not found`,
      },
    },
    { status: 404 },
  );

  response.headers.set(TENANT_ERROR_HEADER, error.message);

  return response;
}

/**
 * Helper to get tenant ID from request headers
 * Useful in route handlers
 */
export function getTenantId(request: NextRequest): string | null {
  return request.headers.get(TENANT_HEADER) || null;
}

/**
 * Helper to get school slug from request headers
 */
export function getSchoolSlug(request: NextRequest): string | null {
  const slug = resolveSchoolSlug(request);
  return slug === (process.env.DEFAULT_SCHOOL_SLUG || "greenwood") ? null : slug;
}

/**
 * Validates that a request is from the correct origin
 */
export function validateOriginMiddleware(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const originHeader = request.headers.get("x-origin-secret");
  const expectedSecret = process.env.CLOUDFLARE_ORIGIN_SECRET;

  return originHeader === expectedSecret;
}

/**
 * Middleware wrapper that validates origin and adds tenant context
 */
export function secureTenantMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => NextResponse,
): NextResponse {
  // Validate origin first
  if (!validateOriginMiddleware(request)) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message:
            "Direct access to this endpoint is not allowed. Please use the configured domain.",
        },
      },
      { status: 403 },
    );
  }

  // Add request ID
  const requestId = crypto.randomUUID();
  const response = handler(request);
  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}
