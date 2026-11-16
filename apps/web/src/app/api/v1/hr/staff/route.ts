import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createStaff, listStaff, updateStaff } from "@school-erp/hr";
import { z } from "zod";

const CreateStaffSchema = z.object({
  employeeCode: z.string().min(1).max(50),
  userId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  joiningDate: z.string().datetime(),
  status: z.enum(["active", "inactive", "terminated", "on_leave"]).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
});

const UpdateStaffSchema = z.object({
  id: z.string().uuid(),
  employeeCode: z.string().min(1).max(50).optional(),
  designationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  joiningDate: z.string().datetime().optional(),
  status: z.enum(["active", "inactive", "terminated", "on_leave"]).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const staff = await listStaff(ctx.schoolId, status);
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
      userId: parsed.data.userId,
      designationId: parsed.data.designationId,
      departmentId: parsed.data.departmentId,
      joiningDate: new Date(parsed.data.joiningDate),
      status: parsed.data.status,
      email: parsed.data.email,
      phone: parsed.data.phone,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: staff, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}

export async function PUT(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = UpdateStaffSchema.safeParse(body);
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
    const staff = await updateStaff(parsed.data.id, parsed.data, ctx.userId);
    return NextResponse.json({ data: staff, meta: { request_id: crypto.randomUUID() } });
  });
}
