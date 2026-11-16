import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createLeaveRequest, listLeaveRequests, updateLeaveRequest } from "@school-erp/hr";
import { z } from "zod";

const CreateLeaveRequestSchema = z.object({
  staffId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  daysRequested: z.number().int().min(1),
  reason: z.string().min(1).max(500),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
});

const UpdateLeaveRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  notes: z.string().max(500).optional(),
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
    const staffId = url.searchParams.get("staffId") ?? undefined;
    const leaveTypeId = url.searchParams.get("leaveTypeId") ?? undefined;
    const leaveRequests = await listLeaveRequests(ctx.schoolId, staffId, status);
    return NextResponse.json({ data: leaveRequests, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateLeaveRequestSchema.safeParse(body);
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
    const leaveRequest = await createLeaveRequest({
      schoolId: ctx.schoolId,
      staffId: parsed.data.staffId,
      leaveTypeId: parsed.data.leaveTypeId,
      academicYearId: parsed.data.academicYearId,
      fromDate: new Date(parsed.data.fromDate),
      toDate: new Date(parsed.data.toDate),
      daysRequested: parsed.data.daysRequested,
      reason: parsed.data.reason,
      status: parsed.data.status,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: leaveRequest, meta: { request_id: crypto.randomUUID() } },
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
    const parsed = UpdateLeaveRequestSchema.safeParse(body);
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
    const leaveRequest = await updateLeaveRequest(parsed.data.id, { status: parsed.data.status, notes: parsed.data.notes }, ctx.userId);
    return NextResponse.json({ data: leaveRequest, meta: { request_id: crypto.randomUUID() } });
  });
}
