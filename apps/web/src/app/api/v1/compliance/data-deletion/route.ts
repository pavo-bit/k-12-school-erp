import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { db, students, users, auditLogs } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "@school-erp/db";

const DataDeletionSchema = z.object({
  entityType: z.enum(["student", "user", "guardian"]),
  entityId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  requestedBy: z.string().uuid(),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = DataDeletionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input.",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { entityType, entityId, reason, requestedBy } = parsed.data;

    // Log the deletion request
    await writeAudit({
      scope: "school",
      schoolId: ctx.schoolId,
      actorId: ctx.userId,
      action: "data_deletion.requested",
      entityType,
      entityId,
      after: { reason, requestedBy },
    });

    // For students: soft delete (mark as withdrawn)
    if (entityType === "student") {
      await db
        .update(students)
        .set({ status: "withdrawn", updatedAt: new Date() })
        .where(and(eq(students.id, entityId), eq(students.schoolId, ctx.schoolId)));

      await writeAudit({
        scope: "school",
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "student.soft_deleted",
        entityType: "student",
        entityId,
        after: { reason },
      });
    }

    // For users: deactivate
    if (entityType === "user") {
      await db
        .update(users)
        .set({ status: "inactive", updatedAt: new Date() })
        .where(eq(users.id, entityId));

      await writeAudit({
        scope: "school",
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "user.deactivated",
        entityType: "user",
        entityId,
        after: { reason },
      });
    }

    return NextResponse.json({
      data: {
        entityType,
        entityId,
        status: "processed",
        message: `${entityType} data deletion request processed`,
      },
      meta: { request_id: crypto.randomUUID() },
    });
  });
}

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }

    // Return deletion request history
    const deletionLogs = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.schoolId, ctx.schoolId), eq(auditLogs.action, "data_deletion.requested")))
      .orderBy(auditLogs.createdAt);

    return NextResponse.json({
      data: deletionLogs,
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
