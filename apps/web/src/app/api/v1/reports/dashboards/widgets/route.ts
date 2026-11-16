import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createDashboardWidget, listDashboardWidgets } from "@school-erp/reports";
import { z } from "zod";

const CreateDashboardWidgetSchema = z.object({
  dashboardId: z.string().uuid(),
  type: z.enum(["stat_card", "line_chart", "bar_chart", "pie_chart", "table", "kpi"]),
  title: z.string().min(1).max(200),
  dataSource: z.string(),
  config: z.any().optional(),
  position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const dashboardId = url.searchParams.get("dashboardId");
    if (!dashboardId)
      return NextResponse.json(
        { error: { code: "MISSING_PARAM", message: "dashboardId required." } },
        { status: 400 },
      );
    const widgets = await listDashboardWidgets(dashboardId);
    return NextResponse.json({ data: widgets, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateDashboardWidgetSchema.safeParse(body);
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
    const widget = await createDashboardWidget({
      dashboardId: parsed.data.dashboardId,
      type: parsed.data.type,
      title: parsed.data.title,
      dataSource: parsed.data.dataSource,
      config: parsed.data.config,
      position: parsed.data.position,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: widget, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
