import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import {
  createPayrollRun,
  listPayrollRuns,
  approvePayrollRun,
  addPayrollItem,
} from "@school-erp/hr";
import { z } from "zod";

const CreateRunSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

const AddItemSchema = z.object({
  runId: z.string().uuid(),
  staffId: z.string().uuid(),
  grossPaise: z.number().int().positive(),
  deductionsPaise: z.number().int().min(0),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const runs = await listPayrollRuns(ctx.schoolId);
    return NextResponse.json({ data: runs, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateRunSchema.safeParse(body);
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
    const run = await createPayrollRun({
      schoolId: ctx.schoolId,
      month: parsed.data.month,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: run, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
