import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { exportStudentsCsv } from "@school-erp/sis";

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const csv = await exportStudentsCsv(ctx.schoolId);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="students.csv"',
      },
    });
  });
}
