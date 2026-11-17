import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { listConcessions, createConcession } from "@school-erp/fees";
import { z } from "zod";

const CreateConcessionSchema = z
  .object({
    studentId: z.string().uuid(),
    feeHeadId: z.string().uuid(),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().int().nonnegative(),
    reason: z.string().min(1).max(400),
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    validTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine((v) => v.type !== "percentage" || v.value <= 100, {
    message: "Percentage concession cannot exceed 100.",
  });

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId") ?? undefined;
    const concessions = await listConcessions(ctx.schoolId, studentId);
    return NextResponse.json({ data: concessions, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateConcessionSchema.safeParse(body);
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
    const concessionInput: Parameters<typeof createConcession>[0] = {
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      feeHeadId: parsed.data.feeHeadId,
      type: parsed.data.type,
      value: parsed.data.value,
      reason: parsed.data.reason,
      approvedBy: ctx.userId,
      validFrom: new Date(parsed.data.validFrom),
    };
    if (parsed.data.validTo) concessionInput.validTo = new Date(parsed.data.validTo);
    const concession = await createConcession(concessionInput);
    return NextResponse.json(
      { data: concession, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
