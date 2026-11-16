import { NextResponse } from "next/server";
import { db } from "@school-erp/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

// In-memory counters (reset on restart)
const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

export function incrementCounter(name: string, labels: Record<string, string> = {}): void {
  const key = `${name}{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(",")}}`;
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

export function recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
  const key = `${name}{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(",")}}`;
  if (!histograms.has(key)) {
    histograms.set(key, []);
  }
  histograms.get(key)!.push(value);
}

export async function GET() {
  const lines: string[] = [];

  // Process metrics
  lines.push("# HELP process_uptime_seconds Process uptime in seconds");
  lines.push("# TYPE process_uptime_seconds gauge");
  lines.push(`process_uptime_seconds ${process.uptime()}`);

  lines.push("# HELP process_memory_heap_used_bytes Heap memory used in bytes");
  lines.push("# TYPE process_memory_heap_used_bytes gauge");
  lines.push(`process_memory_heap_used_bytes ${process.memoryUsage().heapUsed}`);

  lines.push("# HELP process_memory_heap_total_bytes Heap memory total in bytes");
  lines.push("# TYPE process_memory_heap_total_bytes gauge");
  lines.push(`process_memory_heap_total_bytes ${process.memoryUsage().heapTotal}`);

  // Database health
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - dbStart;

    lines.push("# HELP db_up Database is up");
    lines.push("# TYPE db_up gauge");
    lines.push("db_up 1");

    lines.push("# HELP db_query_latency_ms Database query latency in milliseconds");
    lines.push("# TYPE db_query_latency_ms gauge");
    lines.push(`db_query_latency_ms ${dbLatency}`);
  } catch {
    lines.push("# HELP db_up Database is up");
    lines.push("# TYPE db_up gauge");
    lines.push("db_up 0");
  }

  // Node.js info
  lines.push("# HELP nodejs_version_info Node.js version info");
  lines.push("# TYPE nodejs_version_info gauge");
  lines.push(`nodejs_version_info{version="${process.version}"} 1`);

  // Custom counters
  for (const [key, value] of counters.entries()) {
    lines.push(`${key} ${value}`);
  }

  // Custom histograms (simplified - just sum and count)
  for (const [key, values] of histograms.entries()) {
    const sum = values.reduce((a, b) => a + b, 0);
    const count = values.length;
    const name = key.split("{")[0];
    lines.push(`${name}_sum${key.includes("{") ? key.slice(key.indexOf("{")) : ""} ${sum}`);
    lines.push(`${name}_count${key.includes("{") ? key.slice(key.indexOf("{")) : ""} ${count}`);
  }

  return new NextResponse(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
