import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, teacherAssignments } from "@school-erp/db";
import { createSession, listAttendanceSessions } from "@school-erp/attendance";
import { withMobileApi } from "@/server/with-mobile-api";
import { z } from "zod";

const CreateSessionSchema = z.object({
  sectionId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionType: z.enum(["daily", "full_day", "morning", "afternoon"]).default("daily"),
});

async function hasSectionAccess(schoolId: string, teacherId: string, sectionId: string) {
  const rows = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.schoolId, schoolId),
        eq(teacherAssignments.teacherId, teacherId),
        eq(teacherAssignments.sectionId, sectionId),
      ),
    )
    .limit(1);
  return Boolean(rows[0]);
}

export async function GET(request: Request) {
  return withMobileApi(request, "teacher", async (ctx) => {
    const url = new URL(request.url);
    const sectionId = url.searchParams.get("sectionId");
    const date = url.searchParams.get("date") ?? undefined;
    if (!sectionId) {
      return NextResponse.json(
        { error: { code: "MISSING_PARAM", message: "sectionId is required." } },
        { status: 400 },
      );
    }
    if (!(await hasSectionAccess(ctx.schoolId, ctx.identityId, sectionId))) {
      return NextResponse.json(
        { error: { code: "SECTION_NOT_ASSIGNED", message: "This section is not assigned to you." } },
        { status: 403 },
      );
    }
    const rows = await listAttendanceSessions(ctx.schoolId, sectionId, date);
    return NextResponse.json({ data: rows, meta: { request_id: crypto.randomUUID() } });
  });
}

export async function POST(request: Request) {
  return withMobileApi(request, "teacher", async (ctx) => {
    const body = await request.json().catch(() => null);
    const parsed = CreateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input.", details: parsed.error.flatten() } },
        { status: 400 },
      );
    }
    if (!(await hasSectionAccess(ctx.schoolId, ctx.identityId, parsed.data.sectionId))) {
      return NextResponse.json(
        { error: { code: "SECTION_NOT_ASSIGNED", message: "This section is not assigned to you." } },
        { status: 403 },
      );
    }
    const session = await createSession({
      schoolId: ctx.schoolId,
      sectionId: parsed.data.sectionId,
      date: parsed.data.date,
      sessionType: parsed.data.sessionType,
      submittedBy: ctx.userId,
      actorId: ctx.userId,
    });
    return NextResponse.json({ data: session, meta: { request_id: crypto.randomUUID() } }, { status: 201 });
  });
}
