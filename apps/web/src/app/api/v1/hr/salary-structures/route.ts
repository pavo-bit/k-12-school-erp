import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createSalaryStructure } from "@school-erp/hr";
import { z } from "zod";

const CreateSalaryStructureSchema = z.object({
  staffId: z.string().uuid(),
  effectiveFrom: z.string().datetime(),
  status: z.enum(["active", "inactive", "draft"]).optional(),
  salaryStructureLines: z.array(z.object({
    salaryComponentId: z.string().uuid(),
    amountPaise: z.number().int().min(0),
    percentage: z.number().optional(),
  })).optional(),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateSalaryStructureSchema.safeParse(body);
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
    const salaryStructure = await createSalaryStructure({
      schoolId: ctx.schoolId,
      staffId: parsed.data.staffId,
      effectiveFrom: new Date(parsed.data.effectiveFrom),
      status: parsed.data.status,
      salaryStructureLines: parsed.data.salaryStructureLines,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: salaryStructure, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
