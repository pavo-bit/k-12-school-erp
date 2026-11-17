import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { listReportJobs, createReportRequest } from "@school-erp/reports";
import { z } from "zod";

const RequestSchema = z.object({
  reportType: z.string().min(1),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const jobs = await listReportJobs(ctx.schoolId);
    return NextResponse.json({ data: jobs, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = RequestSchema.safeParse(body);
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
    const job = await createReportRequest({
      schoolId: ctx.schoolId,
      reportType: parsed.data.reportType,
      requestedBy: ctx.userId,
    });
    return NextResponse.json(
      { data: job, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
