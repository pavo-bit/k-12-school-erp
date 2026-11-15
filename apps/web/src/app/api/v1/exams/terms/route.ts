import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createExamTerm, listExamTerms } from "@school-erp/exams";
import { z } from "zod";

const CreateTermSchema = z.object({
  academicYearId: z.string().uuid(),
  name: z.string().min(1).max(80),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
    const terms = await listExamTerms(ctx.schoolId, academicYearId);
    return NextResponse.json({ data: terms, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateTermSchema.safeParse(body);
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
    const term = await createExamTerm({
      schoolId: ctx.schoolId,
      academicYearId: parsed.data.academicYearId,
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: term, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
