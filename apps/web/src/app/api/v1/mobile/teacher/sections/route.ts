import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { classes, db, sections, teacherAssignments } from "@school-erp/db";
import { withMobileApi } from "@/server/with-mobile-api";

export async function GET(request: Request) {
  return withMobileApi(request, "teacher", async (ctx) => {
    const rows = await db
      .select({
        assignmentId: teacherAssignments.id,
        sectionId: sections.id,
        sectionName: sections.name,
        room: sections.room,
        classId: classes.id,
        className: classes.name,
        subjectId: teacherAssignments.subjectId,
        academicYearId: teacherAssignments.academicYearId,
      })
      .from(teacherAssignments)
      .innerJoin(sections, eq(sections.id, teacherAssignments.sectionId))
      .innerJoin(classes, eq(classes.id, sections.classId))
      .where(
        and(
          eq(teacherAssignments.schoolId, ctx.schoolId),
          eq(teacherAssignments.teacherId, ctx.identityId),
          eq(classes.academicYearId, teacherAssignments.academicYearId),
        ),
      );

    return NextResponse.json({
      data: rows,
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
