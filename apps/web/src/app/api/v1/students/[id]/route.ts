import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { getStudent } from "@school-erp/sis";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }
    const { id } = await params;
    const student = await getStudent(id);
    if (!student) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Student not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: student, meta: { request_id: crypto.randomUUID() } });
  });
}
