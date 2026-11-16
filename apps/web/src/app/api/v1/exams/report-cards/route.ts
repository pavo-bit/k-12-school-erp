import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createReportCard, listReportCards } from "@school-erp/exams";
import { z } from "zod";

const CreateReportCardSchema = z.object({
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  templateId: z.string().uuid(),
  objectPath: z.string(),
  status: z.enum(["draft", "generated", "published", "archived"]).optional(),
  publishedAt: z.string().datetime().optional(),
  version: z.number().int().min(1).optional(),
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
    const studentId = url.searchParams.get("studentId") ?? undefined;
    const reportCards = await listReportCards(ctx.schoolId, examId, studentId);
    return NextResponse.json({ data: reportCards, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateReportCardSchema.safeParse(body);
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
    const reportCard = await createReportCard({
      schoolId: ctx.schoolId,
      examId: parsed.data.examId,
      studentId: parsed.data.studentId,
      templateId: parsed.data.templateId,
      objectPath: parsed.data.objectPath,
      status: parsed.data.status,
      publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : undefined,
      version: parsed.data.version,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: reportCard, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
