import { NextResponse } from "next/server";
import { db } from "@school-erp/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const startTime = Date.now();

  // Database health check
  let dbStatus = "ok";
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
  }

  const totalLatency = Date.now() - startTime;

  const metrics = {
    service: "school-erp-web",
    version: process.env.npm_package_version ?? "0.1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: dbStatus,
        latency_ms: dbLatency,
      },
    },
    performance: {
      request_latency_ms: totalLatency,
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      memory_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  const status = dbStatus === "ok" ? 200 : 503;

  return NextResponse.json(metrics, { status });
}
