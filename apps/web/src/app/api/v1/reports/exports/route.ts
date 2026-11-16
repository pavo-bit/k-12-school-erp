import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createReportExport, listReportExports } from "@school-erp/reports";
import { z } from "zod";

const CreateReportExportSchema = z.object({
  reportId: z.string().uuid(),
  format: z.enum(["csv", "xlsx", "pdf"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const reportId = url.searchParams.get("reportId") ?? undefined;
    const exports = await listReportExports(ctx.schoolId, reportId);
    return NextResponse.json({ data: exports, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateReportExportSchema.safeParse(body);
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
    const reportExport = await createReportExport({
      schoolId: ctx.schoolId,
      reportId: parsed.data.reportId,
      format: parsed.data.format,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: reportExport, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
