import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import {
  db,
  students,
  enrollments,
  classes,
  sections,
  schools,
  academicYears,
  attendanceRecords,
  attendanceSessions,
  subjects,
  examTerms,
  exams,
  examSubjects,
  marks,
  results,
  gradingSchemes,
  gradeBands,
} from "@school-erp/db";
import { createReportCard, listReportCards } from "@school-erp/exams";
import {
  renderReportCardPdf,
  type ReportCardLine,
  type ReportCardData,
} from "@school-erp/documents";
import { createLocalStorage } from "@school-erp/storage";
import { eq, and, asc, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const GenerateSchema = z.object({
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
});

const storage = createLocalStorage(process.env.LOCAL_STORAGE_PATH ?? "./.local/storage");

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId") ?? undefined;
    const examId = url.searchParams.get("examId") ?? undefined;
    const cards = await listReportCards(ctx.schoolId, examId, studentId);
    return NextResponse.json({ data: cards, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = GenerateSchema.safeParse(body);
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

    const { examId, studentId } = parsed.data;
    const schoolId = ctx.schoolId;

    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)))
      .limit(1);
    if (!student)
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Student not found." } },
        { status: 404 },
      );

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.schoolId, schoolId)))
      .limit(1);
    if (!exam)
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Exam not found." } },
        { status: 404 },
      );

    const [term] = await db.select().from(examTerms).where(eq(examTerms.id, exam.termId)).limit(1);
    const [school] = await db
      .select({ name: schools.name })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);
    const [year] = term
      ? await db
          .select()
          .from(academicYears)
          .where(eq(academicYears.id, term.academicYearId))
          .limit(1)
      : [undefined];

    // Enrollment (latest active for this student) → class/section names
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.schoolId, schoolId)))
      .orderBy(desc(enrollments.createdAt))
      .limit(1);
    const [klass] = enrollment
      ? await db.select().from(classes).where(eq(classes.id, enrollment.classId)).limit(1)
      : [undefined];
    const [section] = enrollment
      ? await db.select().from(sections).where(eq(sections.id, enrollment.sectionId)).limit(1)
      : [undefined];

    // Subjects for this exam (class-scoped) + this student's marks
    const examSubjectRows = await db
      .select()
      .from(examSubjects)
      .where(and(eq(examSubjects.examId, examId), eq(examSubjects.schoolId, schoolId)))
      .orderBy(asc(examSubjects.createdAt));
    const subjectIds = examSubjectRows.map((r) => r.subjectId);
    const subjectRows = subjectIds.length
      ? await db.select().from(subjects).where(eq(subjects.schoolId, schoolId))
      : [];
    const subjectById = new Map(subjectRows.map((s) => [s.id, s]));

    const markRows = await db
      .select()
      .from(marks)
      .where(and(eq(marks.schoolId, schoolId), eq(marks.studentId, studentId)));
    const markByExamSubjectId = new Map(markRows.map((m) => [m.examSubjectId, m]));

    let totalMax = 0;
    let totalObtained = 0;
    let anyFail = false;

    const lines: ReportCardLine[] = examSubjectRows.map((es) => {
      const subject = subjectById.get(es.subjectId);
      const maxMarks = Number.parseFloat(es.maxMarks) || 0;
      const passMarks = Number.parseFloat(es.passMarks) || 0;
      const m = markByExamSubjectId.get(es.id);
      const theory =
        m?.theoryMarks != null && m.theoryMarks !== "" ? Number.parseFloat(m.theoryMarks) : null;
      const practical =
        m?.practicalMarks != null && m.practicalMarks !== ""
          ? Number.parseFloat(m.practicalMarks)
          : null;
      const obtained =
        theory !== null || practical !== null ? (theory ?? 0) + (practical ?? 0) : null;

      totalMax += maxMarks;
      if (obtained !== null) totalObtained += obtained;
      let status: ReportCardLine["status"] = "absent";
      if (obtained !== null) status = obtained >= passMarks ? "pass" : "fail";
      if (status === "fail") anyFail = true;

      return {
        subject: subject?.name ?? "Subject",
        code: subject?.code ?? null,
        maxMarks: String(maxMarks),
        passMarks: String(passMarks),
        theoryMarks: theory === null ? null : String(theory),
        practicalMarks: practical === null ? null : String(practical),
        obtained: obtained === null ? null : String(obtained),
        status,
      };
    });

    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;

    // Grade: use the school's grading scheme when one exists; otherwise a sane default.
    let grade: string | null;
    const [scheme] = await db
      .select()
      .from(gradingSchemes)
      .where(eq(gradingSchemes.schoolId, schoolId))
      .limit(1);
    if (scheme) {
      const bands = await db
        .select()
        .from(gradeBands)
        .where(eq(gradeBands.gradingSchemeId, scheme.id));
      grade =
        bands.find(
          (b) =>
            percentage >= Number.parseFloat(b.minPercentage) &&
            percentage <= Number.parseFloat(b.maxPercentage),
        )?.grade ?? null;
    } else {
      grade =
        percentage >= 90
          ? "A1"
          : percentage >= 80
            ? "A2"
            : percentage >= 70
              ? "B1"
              : percentage >= 60
                ? "B2"
                : percentage >= 50
                  ? "C1"
                  : percentage >= 40
                    ? "D"
                    : "E";
    }

    // Result: persisted row wins; otherwise derive from line statuses.
    const [resultRow] = await db
      .select()
      .from(results)
      .where(
        and(
          eq(results.examId, examId),
          eq(results.studentId, studentId),
          eq(results.schoolId, schoolId),
        ),
      )
      .limit(1);
    const resultStatus = resultRow?.resultStatus ?? (anyFail || percentage < 40 ? "fail" : "pass");
    const finalGrade = resultRow?.grade ?? grade;

    // Attendance aggregate (best-effort; omitted when no data)
    let attendancePresent: number | null = null;
    let attendanceTotal: number | null = null;
    try {
      const rows = await db
        .select({ status: attendanceRecords.status })
        .from(attendanceRecords)
        .where(
          and(eq(attendanceRecords.schoolId, schoolId), eq(attendanceRecords.studentId, studentId)),
        );
      if (rows.length > 0) {
        attendanceTotal = rows.length;
        attendancePresent = rows.filter((r) => r.status === "present").length;
      }
    } catch {
      // attendance data unavailable — leave as absent from PDF
    }

    const pdfData: ReportCardData = {
      schoolName: school?.name ?? "School",
      academicYear: year?.name ?? "—",
      examName: exam.name,
      examType: exam.type,
      termName: term?.name ?? null,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      admissionNumber: student.admissionNumber,
      className: klass?.name ?? "—",
      sectionName: section?.name ?? "—",
      rollNumber: enrollment?.rollNumber ?? null,
      dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth) : null,
      lines,
      totalMax: String(totalMax),
      totalObtained: String(Math.round(totalObtained * 100) / 100),
      percentage: String(percentage),
      grade: finalGrade,
      resultStatus,
      attendancePresent,
      attendanceTotal,
      generatedAt: new Date().toISOString(),
    };

    const pdf = await renderReportCardPdf(pdfData);

    // Persist a copy to storage and record the report card row
    const key = `report-cards/${schoolId}/${studentId}/${randomUUID()}.pdf`;
    await storage.put(key, pdf, "application/pdf");
    const card = await createReportCard({
      schoolId,
      examId,
      studentId,
      templateId: "1",
      objectPath: key,
      status: "generated",
      actorId: ctx.userId,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-card-${student.admissionNumber}-${exam.name.replace(/[^a-z0-9-]+/gi, "_")}.pdf"`,
        "Content-Length": String(pdf.length),
        "X-Report-Card-Id": card.id,
      },
    });
  });
}
