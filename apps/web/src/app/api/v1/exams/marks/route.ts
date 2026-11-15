import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import {
  enterMarks,
  getMarks,
  submitMarks,
  lockMarks,
  computeResults,
  getResults,
} from "@school-erp/exams";
import { z } from "zod";

const EnterMarksSchema = z.object({
  examSubjectId: z.string().uuid(),
  studentId: z.string().uuid(),
  theoryMarks: z.number().min(0).optional(),
  practicalMarks: z.number().min(0).optional(),
});

const SubmitMarksSchema = z.object({
  examSubjectId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

const ComputeResultsSchema = z.object({
  examId: z.string().uuid(),
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
    if (examSubjectId) {
      const marks = await getMarks(ctx.schoolId, examSubjectId);
      return NextResponse.json({ data: marks, meta: { request_id: crypto.randomUUID() } });
    }
    if (examId) {
      const results = await getResults(ctx.schoolId, examId);
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
    const parsed = EnterMarksSchema.safeParse(body);
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
    const result = await enterMarks({
      schoolId: ctx.schoolId,
      examSubjectId: parsed.data.examSubjectId,
      studentId: parsed.data.studentId,
      theoryMarks: parsed.data.theoryMarks,
      practicalMarks: parsed.data.practicalMarks,
      enteredBy: ctx.userId,
    });
    return NextResponse.json(
      { data: result, meta: { request_id: crypto.randomUUID() } },
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
    const parsed = SubmitMarksSchema.safeParse(body);
    if (parsed.success) {
      const result = await submitMarks(
        ctx.schoolId,
        parsed.data.examSubjectId,
        parsed.data.sectionId,
        ctx.userId,
      );
      return NextResponse.json({ data: result, meta: { request_id: crypto.randomUUID() } });
    }
    const computeParsed = ComputeResultsSchema.safeParse(body);
    if (computeParsed.success) {
      const results = await computeResults({
        schoolId: ctx.schoolId,
        examId: computeParsed.data.examId,
        actorId: ctx.userId,
      });
      return NextResponse.json({ data: results, meta: { request_id: crypto.randomUUID() } });
    }
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input." } },
      { status: 400 },
    );
  });
}
