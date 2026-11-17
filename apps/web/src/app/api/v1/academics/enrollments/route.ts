import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createEnrollment, listEnrollments } from "@school-erp/sis";
import { z } from "zod";

const CreateEnrollmentSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().max(20).optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academicYearId") ?? undefined;
    const enrollments = await listEnrollments(ctx.schoolId, academicYearId);
    return NextResponse.json({ data: enrollments, meta: { request_id: crypto.randomUUID() } });
  });
}

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateEnrollmentSchema.safeParse(body);
    if (!parsed.success)
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
    const enrollmentInput: Parameters<typeof createEnrollment>[0] = {
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      academicYearId: parsed.data.academicYearId,
      classId: parsed.data.classId,
      sectionId: parsed.data.sectionId,
      actorId: ctx.userId,
    };
    if (parsed.data.rollNumber) enrollmentInput.rollNumber = parsed.data.rollNumber;
    const enrollment = await createEnrollment(enrollmentInput);
    return NextResponse.json(
      { data: enrollment, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
