import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { listAttendanceSummaries, listFeeSummaries } from "@school-erp/reports";

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "all";
    const sectionId = url.searchParams.get("sectionId") ?? undefined;
    const academicYearId = url.searchParams.get("academicYearId") ?? undefined;

    const data: Record<string, unknown> = {};
    if (type === "attendance" || type === "all")
      data.attendance = await listAttendanceSummaries(ctx.schoolId, sectionId);
    if (type === "fees" || type === "all")
      data.fees = await listFeeSummaries(ctx.schoolId, academicYearId);
    return NextResponse.json({ data, meta: { request_id: crypto.randomUUID() } });
  });
}
