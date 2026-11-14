import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createAnnouncement, listAnnouncements } from "@school-erp/communication";
import { z } from "zod";

const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  audience: z.string().min(1).max(40),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const announcements = await listAnnouncements(ctx.schoolId);
    return NextResponse.json({ data: announcements, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateAnnouncementSchema.safeParse(body);
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
    const announcement = await createAnnouncement({
      schoolId: ctx.schoolId,
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: announcement, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
