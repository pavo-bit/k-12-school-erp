import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createStudent, listStudents, listStudentsBySection } from "@school-erp/sis";
import { z } from "zod";

const CreateStudentSchema = z.object({
  admissionNumber: z.string().min(1).max(40),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other"]),
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
    const search = url.searchParams.get("q") ?? undefined;
    const sectionId = url.searchParams.get("sectionId") ?? undefined;
    const students = sectionId
      ? await listStudentsBySection(ctx.schoolId, sectionId)
      : await listStudents(ctx.schoolId, search);
    return NextResponse.json({ data: students, meta: { request_id: crypto.randomUUID() } });
  });
}

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }
    const body = await request.json().catch(() => null);
    const parsed = CreateStudentSchema.safeParse(body);
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
    const student = await createStudent({
      schoolId: ctx.schoolId,
      admissionNumber: parsed.data.admissionNumber,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: student, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
