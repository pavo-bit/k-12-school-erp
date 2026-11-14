import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const authConfigured = Boolean(process.env.BETTER_AUTH_SECRET);
  const ready = databaseConfigured && authConfigured;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: {
        database: databaseConfigured,
        auth: authConfigured,
      },
    },
    { status: ready ? 200 : 503 },
  );
}
