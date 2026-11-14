import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createFeeStructure, listFeeStructures } from "@school-erp/fees";
import { z } from "zod";

const CreateFeeStructureSchema = z.object({
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  name: z.string().min(1).max(120),
  lines: z
    .array(
      z.object({
        feeHeadId: z.string().uuid(),
        amountPaise: z.number().int().positive(),
        frequency: z.string().default("annual"),
      }),
    )
    .min(1),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const structures = await listFeeStructures(ctx.schoolId);
    return NextResponse.json({ data: structures, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateFeeStructureSchema.safeParse(body);
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
    const structure = await createFeeStructure({
      schoolId: ctx.schoolId,
      academicYearId: parsed.data.academicYearId,
      classId: parsed.data.classId,
      name: parsed.data.name,
      lines: parsed.data.lines,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: structure, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
