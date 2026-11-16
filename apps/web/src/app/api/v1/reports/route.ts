import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createReport, listReports, updateReport } from "@school-erp/reports";
import { z } from "zod";

const CreateReportSchema = z.object({
  type: z.enum(["attendance", "fee_collection", "enrollment", "exam_results", "student_list", "custom"]),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  filters: z.any().optional(),
  schedule: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? undefined;
    const reports = await listReports(ctx.schoolId, type);
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
    const parsed = CreateReportSchema.safeParse(body);
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
    const report = await createReport({
      schoolId: ctx.schoolId,
      type: parsed.data.type,
      name: parsed.data.name,
      description: parsed.data.description,
      filters: parsed.data.filters,
      schedule: parsed.data.schedule,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: report, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}

export async function PATCH(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional(),
      filters: z.any().optional(),
      schedule: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
    }).safeParse(body);
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
    const report = await updateReport(
      parsed.data.id,
      {
        name: parsed.data.name,
        description: parsed.data.description,
        filters: parsed.data.filters,
        schedule: parsed.data.schedule,
      },
      ctx.userId,
    );
    return NextResponse.json({ data: report, meta: { request_id: crypto.randomUUID() } });
  });
}
