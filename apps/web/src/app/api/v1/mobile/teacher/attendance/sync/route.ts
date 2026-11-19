import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  attendanceSessions,
  enrollments,
  teacherAssignments,
} from "@school-erp/db";
import {
  createSyncOperation,
  getSyncOperation,
  markAttendance,
  submitSession,
  updateSyncOperation,
} from "@school-erp/attendance";
import { withMobileApi } from "@/server/with-mobile-api";
import { z } from "zod";

const OperationSchema = z.object({
  operationId: z.string().min(16).max(128),
  deviceId: z.string().min(8).max(128),
  sessionId: z.string().uuid(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["present", "absent", "late", "half_day", "excused"]),
    }),
  ).min(1).max(200),
  submit: z.boolean().default(false),
});

const SyncSchema = z.object({
  operations: z.array(OperationSchema).min(1).max(10),
});

export async function POST(request: Request) {
  return withMobileApi(request, "teacher", async (ctx) => {
    const body = await request.json().catch(() => null);
    const parsed = SyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid sync payload.", details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const operationIds = parsed.data.operations.map((operation) => operation.operationId);
    if (new Set(operationIds).size !== operationIds.length) {
      return NextResponse.json(
        { error: { code: "DUPLICATE_OPERATION", message: "A sync batch cannot contain the same operation more than once." } },
        { status: 400 },
      );
    }

    const results: Array<Record<string, unknown>> = [];
    for (const operation of parsed.data.operations) {
      const previous = await getSyncOperation(operation.deviceId, operation.operationId);
      if (previous?.status === "synced" && previous.result) {
        try {
          results.push(JSON.parse(previous.result) as Record<string, unknown>);
          continue;
        } catch {
          return NextResponse.json(
            { error: { code: "SYNC_RESULT_INVALID", message: "A saved sync result could not be read. Contact your school administrator." } },
            { status: 500 },
          );
        }
      }
      if (previous) {
        return NextResponse.json(
          { error: { code: "SYNC_IN_PROGRESS", message: "This attendance operation is already being processed. Retry it later." } },
          { status: 409 },
        );
      }

      const sessionRows = await db
        .select({ id: attendanceSessions.id, sectionId: attendanceSessions.sectionId })
        .from(attendanceSessions)
        .innerJoin(
          teacherAssignments,
          and(
            eq(teacherAssignments.sectionId, attendanceSessions.sectionId),
            eq(teacherAssignments.schoolId, attendanceSessions.schoolId),
            eq(teacherAssignments.teacherId, ctx.identityId),
          ),
        )
        .where(
          and(
            eq(attendanceSessions.id, operation.sessionId),
            eq(attendanceSessions.schoolId, ctx.schoolId),
          ),
        )
        .limit(1);
      const session = sessionRows[0];
      if (!session) {
        return NextResponse.json(
          { error: { code: "SESSION_NOT_ASSIGNED", message: "An attendance session in this batch is not assigned to you." } },
          { status: 403 },
        );
      }

      const studentIds = [...new Set(operation.records.map((record) => record.studentId))];
      if (studentIds.length !== operation.records.length) {
        return NextResponse.json(
          { error: { code: "DUPLICATE_STUDENT", message: "A student appears more than once in an attendance operation." } },
          { status: 400 },
        );
      }

      const activeEnrollments = await db
        .select({ studentId: enrollments.studentId })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.schoolId, ctx.schoolId),
            eq(enrollments.sectionId, session.sectionId),
            eq(enrollments.status, "active"),
            inArray(enrollments.studentId, studentIds),
          ),
        );
      if (activeEnrollments.length !== studentIds.length) {
        return NextResponse.json(
          { error: { code: "ROSTER_MISMATCH", message: "An attendance operation contains a student outside the active section roster." } },
          { status: 422 },
        );
      }

      const syncOperation = await createSyncOperation(
        ctx.schoolId,
        operation.deviceId,
        operation.operationId,
      );
      const attendance = await markAttendance({
        schoolId: ctx.schoolId,
        sessionId: operation.sessionId,
        records: operation.records,
        actorId: ctx.userId,
        source: "mobile",
      });
      if (operation.submit) {
        await submitSession(ctx.schoolId, operation.sessionId, ctx.userId);
      }

      const result = {
        operationId: operation.operationId,
        sessionId: operation.sessionId,
        count: attendance.count,
        status: operation.submit ? "submitted" : "draft",
      };
      await updateSyncOperation(syncOperation.id, "synced", JSON.stringify(result));
      results.push(result);
    }

    return NextResponse.json({
      data: { synced: results.length, results },
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
