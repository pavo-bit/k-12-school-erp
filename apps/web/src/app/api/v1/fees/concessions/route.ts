import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createConcession } from "@school-erp/fees";
import { z } from "zod";

const CreateConcessionSchema = z.object({
  studentId: z.string().uuid(),
  feeHeadId: z.string().uuid(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  reason: z.string().min(1).max(500),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
});

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
    const concession = await createConcession({
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      feeHeadId: parsed.data.feeHeadId,
      type: parsed.data.type,
      value: parsed.data.value,
      reason: parsed.data.reason,
      approvedBy: ctx.userId,
      validFrom: new Date(parsed.data.validFrom),
      validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : undefined,
    });
    return NextResponse.json(
      { data: concession, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
