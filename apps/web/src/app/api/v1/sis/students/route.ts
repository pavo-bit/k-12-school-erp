import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createStudent, listStudents } from "@school-erp/sis";
import { CreateStudentSchema, StudentSearchSchema } from "@school-erp/sis";
import { z } from "zod";

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const parsed = StudentSearchSchema.safeParse(searchParams);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid search parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );

    const students = await listStudents(ctx.schoolId, parsed.data, {
      page: parsed.data.page ?? 1,
      limit: parsed.data.limit ?? 20,
    });

    return NextResponse.json({
      data: students,
      meta: { request_id: crypto.randomUUID() },
    });
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
    const parsed = CreateStudentSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );

    const student = await createStudent({
      schoolId: ctx.schoolId,
      admissionNumber: parsed.data.admissionNumber,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: new Date(parsed.data.dateOfBirth),
      gender: parsed.data.gender,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      bloodGroup: parsed.data.bloodGroup,
      category: parsed.data.category,
      religion: parsed.data.religion,
      caste: parsed.data.caste,
      guardianId: parsed.data.guardianId,
      status: parsed.data.status,
      actorId: ctx.userId,
    });

    return NextResponse.json(
      { data: student, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
