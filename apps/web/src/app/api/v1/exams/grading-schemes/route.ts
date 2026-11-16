import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createGradingScheme } from "@school-erp/exams";
import { z } from "zod";

const CreateGradingSchemeSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateGradingSchemeSchema.safeParse(body);
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
    const scheme = await createGradingScheme({
      schoolId: ctx.schoolId,
      name: parsed.data.name,
      description: parsed.data.description,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: scheme, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
