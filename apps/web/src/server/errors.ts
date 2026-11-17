export interface NormalizedError {
  status: number;
  code: string;
  message: string;
}

/**
 * Maps low-level errors (Postgres, network) to API-safe responses.
 * Never leaks SQL or stack traces to clients.
 */
export function normalizeError(error: unknown): NormalizedError {
  const pgError = error as { code?: string; message?: string } | null;
  const code = pgError?.code;

  if (code === "23505") {
    return {
      status: 409,
      code: "DUPLICATE_RECORD",
      message: "A record with these values already exists.",
    };
  }
  if (code === "23503") {
    return {
      status: 422,
      code: "REFERENCE_NOT_FOUND",
      message: "A referenced record does not exist.",
    };
  }
  if (code === "23514") {
    return { status: 422, code: "INVALID_VALUE", message: "A value violates a constraint." };
  }
  if (code === "22000" || code === "22001") {
    return { status: 422, code: "DATA_ERROR", message: "Invalid data." };
  }
  if (code === "57014") {
    return { status: 504, code: "QUERY_TIMEOUT", message: "The query timed out." };
  }
  if (code === "53300" || code === "53400") {
    return { status: 503, code: "DATABASE_BUSY", message: "The database is temporarily busy." };
  }
  if (error instanceof Error && error.name === "DomainError") {
    return { status: 422, code: "BUSINESS_RULE", message: error.message };
  }
  return { status: 500, code: "INTERNAL_ERROR", message: "Unexpected error." };
}
