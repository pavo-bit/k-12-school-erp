import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { db, auditLogs } from "@school-erp/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";

const AuditLogQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const parsed = AuditLogQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { entityType, entityId, actorId, action, dateFrom, dateTo, page, limit } = parsed.data;

    const conditions = [eq(auditLogs.schoolId, ctx.schoolId)];
    if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
    if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
    if (actorId) conditions.push(eq(auditLogs.actorId, actorId));
    if (action) conditions.push(eq(auditLogs.action, action));
    if (dateFrom) conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(auditLogs.createdAt, new Date(dateTo)));

    const offset = (page - 1) * limit;
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: logs,
      meta: {
        request_id: crypto.randomUUID(),
        page,
        limit,
        total: logs.length,
      },
    });
  });
}
