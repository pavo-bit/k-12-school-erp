import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { markAttendance, submitSession } from "@school-erp/attendance";
import { z } from "zod";

const MarkSchema = z.object({
  sessionId: z.string().uuid(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["present", "absent", "late", "half_day"]),
    }),
  ),
  submit: z.boolean().default(false),
});

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
      schoolId: ctx.schoolId,
      sessionId: parsed.data.sessionId,
      records: parsed.data.records,
      actorId: ctx.userId,
    });
    if (parsed.data.submit) {
      await submitSession(ctx.schoolId, parsed.data.sessionId, ctx.userId);
    }
    return NextResponse.json({ data: result, meta: { request_id: crypto.randomUUID() } });
  });
}
