import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createNotificationTemplate } from "@school-erp/communication";
import { z } from "zod";

const CreateNotificationTemplateSchema = z.object({
  key: z.string().min(1).max(100),
  channel: z.enum(["email", "sms", "push", "whatsapp"]),
  language: z.string().min(2).max(10),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  status: z.enum(["active", "inactive", "draft"]).optional(),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateNotificationTemplateSchema.safeParse(body);
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
    const template = await createNotificationTemplate({
      schoolId: ctx.schoolId,
      key: parsed.data.key,
      channel: parsed.data.channel,
      language: parsed.data.language,
      subject: parsed.data.subject,
      body: parsed.data.body,
      status: parsed.data.status,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: template, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
