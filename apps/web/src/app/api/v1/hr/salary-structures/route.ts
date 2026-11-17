import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createSalaryStructure } from "@school-erp/hr";
import { z } from "zod";

const CreateSchema = z.object({
  staffId: z.string().uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z
    .array(
      z.object({
        componentId: z.string().uuid(),
        amountPaise: z.number().int().min(0),
        percentage: z.number().optional(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
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
    const structure = await createSalaryStructure({
      schoolId: ctx.schoolId,
      staffId: parsed.data.staffId,
      effectiveFrom: parsed.data.effectiveFrom,
      lines: parsed.data.lines,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: structure, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
