import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createSection, listSections } from "@school-erp/academics";
import { z } from "zod";

const CreateSectionSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().min(1).max(20),
  room: z.string().max(40).optional(),
  capacity: z.number().int().positive().optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const classId = url.searchParams.get("classId") ?? undefined;
    const sections = await listSections(ctx.schoolId, classId);
    return NextResponse.json({ data: sections, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateSectionSchema.safeParse(body);
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
    const section = await createSection({
      schoolId: ctx.schoolId,
      classId: parsed.data.classId,
      name: parsed.data.name,
      room: parsed.data.room,
      capacity: parsed.data.capacity,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: section, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
