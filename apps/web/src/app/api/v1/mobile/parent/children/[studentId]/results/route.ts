import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, exams, reportCards, results } from "@school-erp/db";
import { withParentChildApi } from "@/server/with-mobile-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;
  return withParentChildApi(request, studentId, async (ctx) => {
    const rows = await db
      .select({
        reportCardId: reportCards.id,
        examId: exams.id,
        examName: exams.name,
        examType: exams.type,
        publishedAt: reportCards.publishedAt,
        reportCardVersion: reportCards.version,
        resultId: results.id,
        totalMarks: results.totalMarks,
        percentage: results.percentage,
        grade: results.grade,
        resultStatus: results.resultStatus,
        resultVersion: results.version,
      })
      .from(reportCards)
      .innerJoin(exams, eq(exams.id, reportCards.examId))
      .leftJoin(
        results,
        and(
          eq(results.examId, reportCards.examId),
          eq(results.studentId, reportCards.studentId),
          eq(results.schoolId, reportCards.schoolId),
        ),
      )
      .where(
        and(
          eq(reportCards.schoolId, ctx.schoolId),
          eq(reportCards.studentId, studentId),
          eq(reportCards.status, "published"),
        ),
      )
      .orderBy(desc(reportCards.publishedAt));

    return NextResponse.json({
      data: rows.map((row) => ({
        ...row,
        reportCardDownloadUrl: `/api/v1/mobile/parent/children/${studentId}/results/${row.reportCardId}`,
      })),
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
