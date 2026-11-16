import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createFeeAssignment } from "@school-erp/fees";
import { z } from "zod";

const CreateFeeAssignmentSchema = z.object({
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  effectiveFrom: z.string().datetime(),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateFeeAssignmentSchema.safeParse(body);
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
    const assignment = await createFeeAssignment({
      schoolId: ctx.schoolId,
      studentId: parsed.data.studentId,
      feeStructureId: parsed.data.feeStructureId,
      academicYearId: parsed.data.academicYearId,
      effectiveFrom: new Date(parsed.data.effectiveFrom),
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: assignment, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
