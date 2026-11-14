import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createStaff, listStaff } from "@school-erp/hr";
import { z } from "zod";

const CreateStaffSchema = z.object({
  employeeCode: z.string().min(1).max(40),
  designationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const staff = await listStaff(ctx.schoolId);
    return NextResponse.json({ data: staff, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateStaffSchema.safeParse(body);
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
    const staff = await createStaff({
      schoolId: ctx.schoolId,
      employeeCode: parsed.data.employeeCode,
      designationId: parsed.data.designationId,
      departmentId: parsed.data.departmentId,
      joiningDate: parsed.data.joiningDate,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: staff, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
