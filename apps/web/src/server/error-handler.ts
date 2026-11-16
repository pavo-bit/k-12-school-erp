import { NextResponse } from "next/server";
import { z } from "zod";

export class AppError extends Error {
  constructor(
    public code: string,
    override message: string,
    public statusCode: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", status: 400 },
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },
  CONFLICT: { code: "CONFLICT", status: 409 },
  RATE_LIMITED: { code: "RATE_LIMITED", status: 429 },
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", status: 500 },
} as const;

export function handleError(error: unknown, requestId?: string): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          requestId,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          requestId,
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  console.error("Unhandled error:", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        requestId,
      },
    },
    { status: 500 },
  );
}

export function notFound(resource: string = "Resource"): AppError {
  return new AppError("NOT_FOUND", `${resource} not found`, 404);
}

export function unauthorized(message: string = "Unauthorized"): AppError {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function forbidden(message: string = "Forbidden"): AppError {
  return new AppError("FORBIDDEN", message, 403);
}

export function conflict(message: string): AppError {
  return new AppError("CONFLICT", message, 409);
}

export function validationError(message: string, details?: unknown): AppError {
  return new AppError("VALIDATION_ERROR", message, 400, details);
}
