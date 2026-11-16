import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createDashboard, listDashboards, updateDashboard } from "@school-erp/reports";
import { z } from "zod";

const CreateDashboardSchema = z.object({
  name: z.string().min(1).max(200),
  layout: z.any().optional(),
  widgets: z.array(z.any()).optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const dashboards = await listDashboards(ctx.schoolId);
    return NextResponse.json({ data: dashboards, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateDashboardSchema.safeParse(body);
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
    const dashboard = await createDashboard({
      schoolId: ctx.schoolId,
      name: parsed.data.name,
      layout: parsed.data.layout,
      widgets: parsed.data.widgets,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: dashboard, meta: { request_id: crypto.randomUUID() } },
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
      layout: z.any().optional(),
      widgets: z.array(z.any()).optional(),
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
    const dashboard = await updateDashboard(
      parsed.data.id,
      {
        name: parsed.data.name,
        layout: parsed.data.layout,
        widgets: parsed.data.widgets,
      },
      ctx.userId,
    );
    return NextResponse.json({ data: dashboard, meta: { request_id: crypto.randomUUID() } });
  });
}
