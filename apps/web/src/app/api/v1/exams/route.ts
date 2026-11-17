import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createExam, listExams, updateExam } from "@school-erp/exams";
import { z } from "zod";

const CreateExamSchema = z.object({
  termId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(["theory", "practical", "both", "internal", "external"]),
  status: z.enum(["draft", "scheduled", "conducted", "completed"]).optional(),
});

const UpdateExamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["theory", "practical", "both", "internal", "external"]).optional(),
  status: z.enum(["draft", "scheduled", "conducted", "completed"]).optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const termId = url.searchParams.get("termId") ?? undefined;
    const exams = await listExams(ctx.schoolId, termId);
    return NextResponse.json({ data: exams, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateExamSchema.safeParse(body);
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
    const exam = await createExam({
      schoolId: ctx.schoolId,
      termId: parsed.data.termId,
      name: parsed.data.name,
      type: parsed.data.type,
      status: parsed.data.status,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: exam, meta: { request_id: crypto.randomUUID() } },
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
    const parsed = UpdateExamSchema.safeParse(body);
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
    const exam = await updateExam(
      parsed.data.id,
      {
        name: parsed.data.name,
        type: parsed.data.type,
        status: parsed.data.status,
      },
      ctx.userId,
    );
    return NextResponse.json({ data: exam, meta: { request_id: crypto.randomUUID() } });
  });
}
