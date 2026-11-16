import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { markAttendance, listAttendanceRecords } from "@school-erp/attendance";
import { z } from "zod";

const MarkSchema = z.object({
  sessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "half_day"]),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId)
      return NextResponse.json(
        { error: { code: "MISSING_PARAM", message: "sessionId required." } },
        { status: 400 },
      );
    const records = await listAttendanceRecords(sessionId);
    return NextResponse.json({ data: records, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = MarkSchema.safeParse(body);
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
    const result = await markAttendance({
      sessionId: parsed.data.sessionId,
      studentId: parsed.data.studentId,
      status: parsed.data.status,
      markedBy: ctx.userId,
    });
    return NextResponse.json({ data: result, meta: { request_id: crypto.randomUUID() } }, { status: 201 });
  });
}
