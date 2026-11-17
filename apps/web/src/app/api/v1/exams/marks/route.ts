import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createMarks, listMarks, listResults } from "@school-erp/exams";
import { z } from "zod";

const EnterMarksSchema = z.object({
  examSubjectId: z.string().uuid(),
  studentId: z.string().uuid(),
  theoryMarks: z.number().min(0).optional(),
  practicalMarks: z.number().min(0).optional(),
  status: z.string().optional(),
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
      const marks = await listMarks(ctx.schoolId, examSubjectId);
      return NextResponse.json({ data: marks, meta: { request_id: crypto.randomUUID() } });
    }
    if (examId) {
      const results = await listResults(ctx.schoolId, examId);
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
    const result = await createMarks({
      schoolId: ctx.schoolId,
      examSubjectId: parsed.data.examSubjectId,
      studentId: parsed.data.studentId,
      theoryMarks: parsed.data.theoryMarks,
      practicalMarks: parsed.data.practicalMarks,
      enteredBy: ctx.userId,
      status: parsed.data.status,
    });
    return NextResponse.json(
      { data: result, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
