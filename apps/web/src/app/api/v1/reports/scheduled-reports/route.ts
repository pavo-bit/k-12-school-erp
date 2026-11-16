import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createScheduledReport, listScheduledReports } from "@school-erp/reports";
import { z } from "zod";

const CreateScheduledReportSchema = z.object({
  reportId: z.string().uuid(),
  recipients: z.array(z.string()).min(1),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().optional(),
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
    const scheduledReports = await listScheduledReports(ctx.schoolId, reportId);
    return NextResponse.json({ data: scheduledReports, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateScheduledReportSchema.safeParse(body);
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
    const scheduledReport = await createScheduledReport({
      schoolId: ctx.schoolId,
      reportId: parsed.data.reportId,
      recipients: parsed.data.recipients,
      frequency: parsed.data.frequency,
      dayOfWeek: parsed.data.dayOfWeek,
      dayOfMonth: parsed.data.dayOfMonth,
      time: parsed.data.time,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: scheduledReport, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
