import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createExamSubject, listExamSubjects } from "@school-erp/exams";
import { z } from "zod";

const CreateExamSubjectSchema = z.object({
  examId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  maxMarks: z.number().int().min(0),
  passMarks: z.number().int().min(0),
  theoryMax: z.number().int().min(0).optional(),
  practicalMax: z.number().int().min(0).optional(),
  weightage: z.number().min(0).max(100).optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const examId = url.searchParams.get("examId") ?? undefined;
    const subjects = await listExamSubjects(ctx.schoolId, examId);
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
    const parsed = CreateExamSubjectSchema.safeParse(body);
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
    const subject = await createExamSubject({
      schoolId: ctx.schoolId,
      examId: parsed.data.examId,
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId,
      maxMarks: parsed.data.maxMarks,
      passMarks: parsed.data.passMarks,
      theoryMax: parsed.data.theoryMax,
      practicalMax: parsed.data.practicalMax,
      weightage: parsed.data.weightage,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: subject, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
