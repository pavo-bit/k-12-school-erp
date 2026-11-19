import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, studentGuardians, guardians, students, enrollments, classes, sections } from "@school-erp/db";
import { withMobileApi } from "@/server/with-mobile-api";

export async function GET(request: Request) {
  return withMobileApi(request, "parent", async (ctx) => {
    const rows = await db
      .select({
        id: students.id,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        status: students.status,
        relationship: studentGuardians.relationship,
        isPrimaryGuardian: studentGuardians.isPrimary,
        canPay: studentGuardians.canPay,
        classId: enrollments.classId,
        className: classes.name,
        sectionId: enrollments.sectionId,
        sectionName: sections.name,
        rollNumber: enrollments.rollNumber,
        academicYearId: enrollments.academicYearId,
      })
      .from(studentGuardians)
      .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
      .innerJoin(students, eq(students.id, studentGuardians.studentId))
      .leftJoin(
        enrollments,
        and(
          eq(enrollments.studentId, students.id),
          eq(enrollments.schoolId, ctx.schoolId),
          eq(enrollments.status, "active"),
        ),
      )
      .leftJoin(classes, eq(classes.id, enrollments.classId))
      .leftJoin(sections, eq(sections.id, enrollments.sectionId))
      .where(
        and(
          eq(studentGuardians.schoolId, ctx.schoolId),
          eq(studentGuardians.status, "active"),
          eq(guardians.userId, ctx.userId),
        ),
      );

    return NextResponse.json({
      data: rows,
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
