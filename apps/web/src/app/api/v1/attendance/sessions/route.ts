import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createSession, listSessions } from "@school-erp/attendance";
import { z } from "zod";

const CreateSessionSchema = z.object({
  sectionId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionType: z.string().default("daily"),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const sectionId = url.searchParams.get("sectionId") ?? undefined;
    const date = url.searchParams.get("date") ?? undefined;
    const sessions = await listSessions(ctx.schoolId, sectionId, date);
    return NextResponse.json({ data: sessions, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateSessionSchema.safeParse(body);
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
    const session = await createSession({
      schoolId: ctx.schoolId,
      sectionId: parsed.data.sectionId,
      date: parsed.data.date,
      sessionType: parsed.data.sessionType,
      submittedBy: ctx.userId,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: session, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
