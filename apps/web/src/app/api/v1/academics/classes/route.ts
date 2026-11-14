import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createClass, listClasses, getActiveAcademicYear } from "@school-erp/academics";
import { z } from "zod";

const CreateClassSchema = z.object({
  name: z.string().min(1).max(40),
  order: z.number().int().min(0).default(0),
  academicYearId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academicYearId") ?? undefined;
    const classes = await listClasses(ctx.schoolId, academicYearId);
    return NextResponse.json({ data: classes, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateClassSchema.safeParse(body);
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
    let academicYearId = parsed.data.academicYearId;
    if (!academicYearId) {
      const ay = await getActiveAcademicYear(ctx.schoolId);
      if (!ay)
        return NextResponse.json(
          { error: { code: "NO_ACTIVE_YEAR", message: "No active academic year." } },
          { status: 400 },
        );
      academicYearId = ay.id;
    }
    const cls = await createClass({
      schoolId: ctx.schoolId,
      academicYearId,
      name: parsed.data.name,
      order: parsed.data.order,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: cls, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
