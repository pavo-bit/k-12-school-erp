import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, attendanceRecords, attendanceSessions } from "@school-erp/db";
import { withParentChildApi } from "@/server/with-mobile-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;
  return withParentChildApi(request, studentId, async (ctx) => {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const conditions = [
      eq(attendanceRecords.schoolId, ctx.schoolId),
      eq(attendanceRecords.studentId, studentId),
      eq(attendanceSessions.schoolId, ctx.schoolId),
      eq(attendanceSessions.status, "submitted"),
    ];
    if (from) conditions.push(gte(attendanceSessions.date, from));
    if (to) conditions.push(lte(attendanceSessions.date, to));

    const rows = await db
      .select({
        recordId: attendanceRecords.id,
        sessionId: attendanceSessions.id,
        date: attendanceSessions.date,
        sessionType: attendanceSessions.sessionType,
        sessionStatus: attendanceSessions.status,
        status: attendanceRecords.status,
        markedAt: attendanceRecords.markedAt,
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.sessionId))
      .where(and(...conditions))
      .orderBy(desc(attendanceSessions.date))
      .limit(366);

    return NextResponse.json({
      data: rows,
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
