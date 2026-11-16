import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createAttendanceSession, listAttendanceSessions } from "@school-erp/attendance";
import { z } from "zod";

const CreateAttendanceSessionSchema = z.object({
  sectionId: z.string().uuid(),
  date: z.string().datetime(),
  sessionType: z.string().min(1).max(50),
  status: z.enum(["open", "closed", "submitted"]).optional(),
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
    const date = url.searchParams.get("date");
    const sessions = await listAttendanceSessions(ctx.schoolId, sectionId, date ? new Date(date) : undefined);
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
    const parsed = CreateAttendanceSessionSchema.safeParse(body);
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
    const session = await createAttendanceSession({
      schoolId: ctx.schoolId,
      sectionId: parsed.data.sectionId,
      date: new Date(parsed.data.date),
      sessionType: parsed.data.sessionType,
      status: parsed.data.status ?? "open",
      submittedBy: ctx.userId,
    });
    return NextResponse.json(
      { data: session, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
