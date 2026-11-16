import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createReportCardTemplate } from "@school-erp/exams";
import { z } from "zod";

const CreateReportCardTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  htmlTemplate: z.string().min(1),
  version: z.number().int().min(1).optional(),
  isDefault: z.boolean().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateReportCardTemplateSchema.safeParse(body);
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
    const template = await createReportCardTemplate({
      schoolId: ctx.schoolId,
      name: parsed.data.name,
      htmlTemplate: parsed.data.htmlTemplate,
      version: parsed.data.version,
      isDefault: parsed.data.isDefault,
      status: parsed.data.status,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: template, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
