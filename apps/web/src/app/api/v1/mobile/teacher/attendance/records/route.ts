import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db, attendanceSessions, enrollments, teacherAssignments } from "@school-erp/db";
import { getSessionRecords, markAttendance, submitSession } from "@school-erp/attendance";
import { withMobileApi } from "@/server/with-mobile-api";
import { z } from "zod";

const MarkSchema = z.object({
  sessionId: z.string().uuid(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["present", "absent", "late", "half_day", "excused"]),
    }),
  ).min(1).max(200),
  submit: z.boolean().default(false),
});

async function getAssignedSession(schoolId: string, teacherId: string, sessionId: string) {
  const rows = await db
    .select({ id: attendanceSessions.id, sectionId: attendanceSessions.sectionId })
    .from(attendanceSessions)
    .innerJoin(
      teacherAssignments,
      and(
        eq(teacherAssignments.sectionId, attendanceSessions.sectionId),
        eq(teacherAssignments.schoolId, attendanceSessions.schoolId),
        eq(teacherAssignments.teacherId, teacherId),
      ),
    )
    .where(
      and(
        eq(attendanceSessions.id, sessionId),
        eq(attendanceSessions.schoolId, schoolId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(request: Request) {
  return withMobileApi(request, "teacher", async (ctx) => {
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { error: { code: "MISSING_PARAM", message: "sessionId is required." } },
        { status: 400 },
      );
    }
    const session = await getAssignedSession(ctx.schoolId, ctx.identityId, sessionId);
    if (!session) {
      return NextResponse.json(
        { error: { code: "SESSION_NOT_ASSIGNED", message: "This attendance session is not assigned to you." } },
        { status: 403 },
      );
    }
    const records = await getSessionRecords(ctx.schoolId, sessionId);
    return NextResponse.json({ data: records, meta: { request_id: crypto.randomUUID() } });
  });
}

export async function POST(request: Request) {
  return withMobileApi(request, "teacher", async (ctx) => {
    const body = await request.json().catch(() => null);
    const parsed = MarkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input.", details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const session = await getAssignedSession(ctx.schoolId, ctx.identityId, parsed.data.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: { code: "SESSION_NOT_ASSIGNED", message: "This attendance session is not assigned to you." } },
        { status: 403 },
      );
    }

    const studentIds = [...new Set(parsed.data.records.map((record) => record.studentId))];
    if (studentIds.length !== parsed.data.records.length) {
      return NextResponse.json(
        { error: { code: "DUPLICATE_STUDENT", message: "A student appears more than once in this attendance batch." } },
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
        { error: { code: "ROSTER_MISMATCH", message: "Attendance contains a student outside this active section roster." } },
        { status: 422 },
      );
    }

    const result = await markAttendance({
      schoolId: ctx.schoolId,
      sessionId: parsed.data.sessionId,
      records: parsed.data.records,
      actorId: ctx.userId,
      source: "mobile",
    });
    if (parsed.data.submit) {
      await submitSession(ctx.schoolId, parsed.data.sessionId, ctx.userId);
    }

    return NextResponse.json({
      data: { ...result, status: parsed.data.submit ? "submitted" : "draft" },
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
