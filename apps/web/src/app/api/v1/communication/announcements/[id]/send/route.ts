import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { sendAnnouncement } from "@school-erp/communication";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const { id } = await params;
    try {
      const result = await sendAnnouncement(ctx.schoolId, id, ctx.userId);
      return NextResponse.json({ data: result, meta: { request_id: crypto.randomUUID() } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send announcement";
      const status = message === "Announcement not found" ? 404 : 500;
      return NextResponse.json(
        { error: { code: status === 404 ? "NOT_FOUND" : "SEND_FAILED", message } },
        { status },
      );
    }
  });
}
