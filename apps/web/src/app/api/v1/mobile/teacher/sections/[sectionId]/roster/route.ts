import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, teacherAssignments } from "@school-erp/db";
import { listStudentsBySection } from "@school-erp/sis";
import { withMobileApi } from "@/server/with-mobile-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> },
) {
  const { sectionId } = await params;
  return withMobileApi(request, "teacher", async (ctx) => {
    const assignment = await db
      .select({ id: teacherAssignments.id })
      .from(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.schoolId, ctx.schoolId),
          eq(teacherAssignments.teacherId, ctx.identityId),
          eq(teacherAssignments.sectionId, sectionId),
        ),
      )
      .limit(1);

    if (!assignment[0]) {
      return NextResponse.json(
        { error: { code: "SECTION_NOT_ASSIGNED", message: "This section is not assigned to you." } },
        { status: 403 },
      );
    }

    const students = await listStudentsBySection(ctx.schoolId, sectionId);
    return NextResponse.json({
      data: students,
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
