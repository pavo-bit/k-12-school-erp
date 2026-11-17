import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { computeAttendanceSummary, computeFeeSummary } from "@school-erp/reports";
import { z } from "zod";

const ComputeSummarySchema = z.object({
  sectionId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  academicYearId: z.string().uuid().optional(),
  reportType: z.enum(["attendance", "fees", "both"]).default("both"),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = ComputeSummarySchema.safeParse(body);
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
    const result: Record<string, unknown> = {};
    if (parsed.data.reportType === "attendance" || parsed.data.reportType === "both") {
      result.attendance = await computeAttendanceSummary(
        ctx.schoolId,
        parsed.data.sectionId,
        parsed.data.date,
      );
    }
    if (parsed.data.reportType === "fees" || parsed.data.reportType === "both") {
      if (!parsed.data.academicYearId)
        return NextResponse.json(
          {
            error: {
              code: "MISSING_PARAM",
              message: "academicYearId is required for fee summaries.",
            },
          },
          { status: 400 },
        );
      result.fees = await computeFeeSummary(
        ctx.schoolId,
        parsed.data.academicYearId,
        parsed.data.date,
      );
    }
    return NextResponse.json({ data: result, meta: { request_id: crypto.randomUUID() } });
  });
}
