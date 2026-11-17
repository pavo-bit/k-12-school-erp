import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { listPeriods, createPeriod } from "@school-erp/timetable";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(40),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  order: z.number().int().min(1).default(1),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const periods = await listPeriods(ctx.schoolId);
    return NextResponse.json({ data: periods, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateSchema.safeParse(body);
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
    const period = await createPeriod({
      schoolId: ctx.schoolId,
      ...parsed.data,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: period, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
