import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import {
  classes,
  db,
  periods,
  sections,
  subjects,
  teacherAssignments,
  timetableSlots,
} from "@school-erp/db";
import { withMobileApi } from "@/server/with-mobile-api";

export async function GET(request: Request) {
  return withMobileApi(request, "teacher", async (ctx) => {
    const url = new URL(request.url);
    const dayParam = url.searchParams.get("dayOfWeek");
    const dayOfWeek = dayParam === null ? undefined : Number(dayParam);

    if (dayOfWeek !== undefined && (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)) {
      return NextResponse.json(
        { error: { code: "INVALID_DAY", message: "dayOfWeek must be an integer from 0 (Sunday) to 6 (Saturday)." } },
        { status: 400 },
      );
    }

    const conditions = [
      eq(timetableSlots.schoolId, ctx.schoolId),
      eq(timetableSlots.teacherId, ctx.identityId),
      eq(teacherAssignments.schoolId, ctx.schoolId),
      eq(teacherAssignments.teacherId, ctx.identityId),
      eq(teacherAssignments.sectionId, timetableSlots.sectionId),
      eq(teacherAssignments.subjectId, timetableSlots.subjectId),
      eq(classes.academicYearId, teacherAssignments.academicYearId),
    ];
    if (dayOfWeek !== undefined) conditions.push(eq(timetableSlots.dayOfWeek, dayOfWeek));

    const rows = await db
      .select({
        id: timetableSlots.id,
        dayOfWeek: timetableSlots.dayOfWeek,
        effectiveFrom: timetableSlots.effectiveFrom,
        sectionId: sections.id,
        sectionName: sections.name,
        classId: classes.id,
        className: classes.name,
        subjectId: subjects.id,
        subjectName: subjects.name,
        periodId: periods.id,
        periodName: periods.name,
        startTime: periods.startTime,
        endTime: periods.endTime,
        room: timetableSlots.room,
        roomId: timetableSlots.roomId,
      })
      .from(timetableSlots)
      .innerJoin(
        teacherAssignments,
        and(
          eq(teacherAssignments.sectionId, timetableSlots.sectionId),
          eq(teacherAssignments.subjectId, timetableSlots.subjectId),
          eq(teacherAssignments.teacherId, timetableSlots.teacherId),
          eq(teacherAssignments.schoolId, timetableSlots.schoolId),
        ),
      )
      .innerJoin(sections, eq(sections.id, timetableSlots.sectionId))
      .innerJoin(classes, eq(classes.id, sections.classId))
      .innerJoin(subjects, eq(subjects.id, timetableSlots.subjectId))
      .innerJoin(periods, eq(periods.id, timetableSlots.periodId))
      .where(and(...conditions));

    return NextResponse.json({
      data: rows,
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
