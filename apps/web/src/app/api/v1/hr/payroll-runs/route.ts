import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createPayrollRun, listPayrollRuns, updatePayrollRun } from "@school-erp/hr";
import { z } from "zod";

const CreatePayrollRunSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  status: z.enum(["draft", "prepared", "approved", "processed", "closed"]).optional(),
  preparedBy: z.string().optional(),
});

const UpdatePayrollRunSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "prepared", "approved", "processed", "closed"]).optional(),
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
    const month = url.searchParams.get("month") ? parseInt(url.searchParams.get("month")!) : undefined;
    const year = url.searchParams.get("year") ? parseInt(url.searchParams.get("year")!) : undefined;
    const payrollRuns = await listPayrollRuns(ctx.schoolId, month, year);
    return NextResponse.json({ data: payrollRuns, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreatePayrollRunSchema.safeParse(body);
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
    const payrollRun = await createPayrollRun({
      schoolId: ctx.schoolId,
      month: parsed.data.month,
      year: parsed.data.year,
      status: parsed.data.status,
      preparedBy: parsed.data.preparedBy ?? ctx.userId,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: payrollRun, meta: { request_id: crypto.randomUUID() } },
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
    const parsed = UpdatePayrollRunSchema.safeParse(body);
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
    const payrollRun = await updatePayrollRun(parsed.data.id, { status: parsed.data.status }, ctx.userId);
    return NextResponse.json({ data: payrollRun, meta: { request_id: crypto.randomUUID() } });
  });
}
