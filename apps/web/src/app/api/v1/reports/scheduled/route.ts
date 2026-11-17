import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createScheduledReport, listScheduledReports } from "@school-erp/reports";
import { z } from "zod";

const CreateScheduledSchema = z.object({
  reportType: z.string().min(1),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  recipients: z.string().min(1),
  nextRunAt: z.string().min(1),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const reports = await listScheduledReports(ctx.schoolId);
    return NextResponse.json({ data: reports, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateScheduledSchema.safeParse(body);
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
    const report = await createScheduledReport({
      schoolId: ctx.schoolId,
      reportType: parsed.data.reportType,
      frequency: parsed.data.frequency,
      recipients: parsed.data.recipients,
      nextRunAt: parsed.data.nextRunAt,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: report, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
