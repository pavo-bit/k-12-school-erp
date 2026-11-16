import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createMarks, listMarks, updateMarks, createResult, listResults } from "@school-erp/exams";
import { z } from "zod";

const CreateMarksSchema = z.object({
  examSubjectId: z.string().uuid(),
  studentId: z.string().uuid(),
  theoryMarks: z.number().min(0),
  practicalMarks: z.number().min(0).optional(),
  status: z.enum(["draft", "submitted", "approved"]).optional(),
});

const UpdateMarksSchema = z.object({
  id: z.string().uuid(),
  theoryMarks: z.number().min(0).optional(),
  practicalMarks: z.number().min(0).optional(),
  status: z.enum(["draft", "submitted", "approved"]).optional(),
});

const CreateResultSchema = z.object({
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  totalMarks: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  grade: z.string(),
  resultStatus: z.enum(["passed", "failed", "conditional"]),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const examSubjectId = url.searchParams.get("examSubjectId");
    const examId = url.searchParams.get("examId");
    const studentId = url.searchParams.get("studentId") ?? undefined;
    if (examSubjectId) {
      const marks = await listMarks(ctx.schoolId, examSubjectId, studentId);
      return NextResponse.json({ data: marks, meta: { request_id: crypto.randomUUID() } });
    }
    if (examId) {
      const results = await listResults(ctx.schoolId, examId, studentId);
      return NextResponse.json({ data: results, meta: { request_id: crypto.randomUUID() } });
    }
    return NextResponse.json(
      { error: { code: "MISSING_PARAM", message: "examSubjectId or examId required." } },
      { status: 400 },
    );
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
    const parsed = CreateMarksSchema.safeParse(body);
    if (parsed.success) {
      const marks = await createMarks({
        schoolId: ctx.schoolId,
        examSubjectId: parsed.data.examSubjectId,
        studentId: parsed.data.studentId,
        theoryMarks: parsed.data.theoryMarks,
        practicalMarks: parsed.data.practicalMarks,
        status: parsed.data.status,
        enteredBy: ctx.userId,
        enteredAt: new Date(),
      });
      return NextResponse.json(
        { data: marks, meta: { request_id: crypto.randomUUID() } },
        { status: 201 },
      );
    }
    const resultParsed = CreateResultSchema.safeParse(body);
    if (resultParsed.success) {
      const result = await createResult({
        schoolId: ctx.schoolId,
        examId: resultParsed.data.examId,
        studentId: resultParsed.data.studentId,
        totalMarks: resultParsed.data.totalMarks,
        percentage: resultParsed.data.percentage,
        grade: resultParsed.data.grade,
        resultStatus: resultParsed.data.resultStatus,
        actorId: ctx.userId,
      });
      return NextResponse.json(
        { data: result, meta: { request_id: crypto.randomUUID() } },
        { status: 201 },
      );
    }
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input." } },
      { status: 400 },
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
    const parsed = UpdateMarksSchema.safeParse(body);
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
    const marks = await updateMarks(parsed.data.id, {
      theoryMarks: parsed.data.theoryMarks,
      practicalMarks: parsed.data.practicalMarks,
      status: parsed.data.status,
    }, ctx.userId);
    return NextResponse.json({ data: marks, meta: { request_id: crypto.randomUUID() } });
  });
}
