import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createSubject, listSubjects } from "@school-erp/academics";
import { z } from "zod";

const CreateSubjectSchema = z.object({
  name: z.string().min(1).max(80),
  code: z.string().max(20).optional(),
  type: z.enum(["core", "elective", "optional"]).default("core"),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const subjects = await listSubjects(ctx.schoolId);
    return NextResponse.json({ data: subjects, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateSubjectSchema.safeParse(body);
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
    const subject = await createSubject({
      schoolId: ctx.schoolId,
      name: parsed.data.name,
      code: parsed.data.code,
      type: parsed.data.type,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: subject, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
