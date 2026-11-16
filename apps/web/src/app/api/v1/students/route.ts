import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createStudent, listStudents, CreateStudentSchema } from "@school-erp/sis";

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
    const students = await listStudents(ctx.schoolId, search);
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
      dateOfBirth: new Date(parsed.data.dateOfBirth),
      gender: parsed.data.gender,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: student, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
