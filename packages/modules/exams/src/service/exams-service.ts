import {
  db,
  examTerms,
  exams,
  examSubjects,
  gradingSchemes,
  gradeBands,
  marks,
  markSubmissions,
  results,
  reportCardTemplates,
  reportCards,
} from "@school-erp/db";
import { eq, and, sql } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

export interface CreateExamTermInput {
  schoolId: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  actorId: string;
}

export async function createExamTerm(input: CreateExamTermInput) {
  const id = randomUUID();
  await db.insert(examTerms).values([
    {
      id,
      schoolId: input.schoolId,
      academicYearId: input.academicYearId,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    },
  ]);
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "exam_term.created",
    entityType: "exam_term",
    entityId: id,
    after: { name: input.name },
  });
  return { id, name: input.name };
}

export async function listExamTerms(schoolId: string, academicYearId?: string) {
  if (academicYearId) {
    return db
      .select()
      .from(examTerms)
      .where(and(eq(examTerms.schoolId, schoolId), eq(examTerms.academicYearId, academicYearId)));
  }
  return db.select().from(examTerms).where(eq(examTerms.schoolId, schoolId));
}

export interface CreateExamInput {
  schoolId: string;
  termId: string;
  name: string;
  type: string;
  actorId: string;
}

export async function createExam(input: CreateExamInput) {
  const id = randomUUID();
  await db.insert(exams).values({
    id,
    schoolId: input.schoolId,
    termId: input.termId,
    name: input.name,
    type: input.type,
    status: "draft",
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "exam.created",
    entityType: "exam",
    entityId: id,
    after: { name: input.name, type: input.type },
  });
  return { id, name: input.name, type: input.type, status: "draft" };
}

export async function listExams(schoolId: string, termId?: string) {
  if (termId) {
    return db
      .select()
      .from(exams)
      .where(and(eq(exams.schoolId, schoolId), eq(exams.termId, termId)));
  }
  return db.select().from(exams).where(eq(exams.schoolId, schoolId));
}

export async function updateExamStatus(
  schoolId: string,
  examId: string,
  status: string,
  actorId: string,
) {
  await db
    .update(exams)
    .set({ status })
    .where(and(eq(exams.schoolId, schoolId), eq(exams.id, examId)));
  await writeAudit({
    scope: "school",
    schoolId,
    actorId,
    action: "exam.status_changed",
    entityType: "exam",
    entityId: examId,
    after: { status },
  });
  return { id: examId, status };
}

export interface ConfigureExamSubjectInput {
  schoolId: string;
  examId: string;
  classId: string;
  subjectId: string;
  maxMarks: number;
  passMarks: number;
  theoryMax?: number;
  practicalMax?: number;
  weightage?: number;
  actorId: string;
}

export async function configureExamSubject(input: ConfigureExamSubjectInput) {
  const id = randomUUID();
  await db.insert(examSubjects).values({
    id,
    schoolId: input.schoolId,
    examId: input.examId,
    classId: input.classId,
    subjectId: input.subjectId,
    maxMarks: String(input.maxMarks),
    passMarks: String(input.passMarks),
    theoryMax: input.theoryMax != null ? String(input.theoryMax) : null,
    practicalMax: input.practicalMax != null ? String(input.practicalMax) : null,
    weightage: input.weightage ?? 1,
  });
  return { id };
}

export async function listExamSubjects(schoolId: string, examId: string, classId?: string) {
  if (classId) {
    return db
      .select()
      .from(examSubjects)
      .where(
        and(
          eq(examSubjects.schoolId, schoolId),
          eq(examSubjects.examId, examId),
          eq(examSubjects.classId, classId),
        ),
      );
  }
  return db
    .select()
    .from(examSubjects)
    .where(and(eq(examSubjects.schoolId, schoolId), eq(examSubjects.examId, examId)));
}

export interface CreateGradingSchemeInput {
  schoolId: string;
  name: string;
  actorId: string;
}

export async function createGradingScheme(input: CreateGradingSchemeInput) {
  const id = randomUUID();
  await db.insert(gradingSchemes).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
  });
  return { id, name: input.name };
}

export async function addGradeBand(
  schemeId: string,
  minPercentage: number,
  maxPercentage: number,
  grade: string,
  gradePoint?: number,
) {
  const id = randomUUID();
  await db.insert(gradeBands).values({
    id,
    gradingSchemeId: schemeId,
    minPercentage: String(minPercentage),
    maxPercentage: String(maxPercentage),
    grade,
    gradePoint: gradePoint != null ? String(gradePoint) : null,
  });
  return { id, grade };
}

export async function listGradingSchemes(schoolId: string) {
  return db.select().from(gradingSchemes).where(eq(gradingSchemes.schoolId, schoolId));
}

export interface EnterMarksInput {
  schoolId: string;
  examSubjectId: string;
  studentId: string;
  theoryMarks?: number | undefined;
  practicalMarks?: number | undefined;
  enteredBy: string;
}

export async function enterMarks(input: EnterMarksInput) {
  const id = randomUUID();
  const total = (input.theoryMarks ?? 0) + (input.practicalMarks ?? 0);
  await db
    .insert(marks)
    .values({
      id,
      schoolId: input.schoolId,
      examSubjectId: input.examSubjectId,
      studentId: input.studentId,
      theoryMarks: input.theoryMarks != null ? String(input.theoryMarks) : null,
      practicalMarks: input.practicalMarks != null ? String(input.practicalMarks) : null,
      status: "draft",
      enteredBy: input.enteredBy,
      version: 1,
    })
    .onConflictDoUpdate({
      target: [marks.examSubjectId, marks.studentId],
      set: {
        theoryMarks: input.theoryMarks != null ? String(input.theoryMarks) : null,
        practicalMarks: input.practicalMarks != null ? String(input.practicalMarks) : null,
        status: "draft",
        enteredBy: input.enteredBy,
        version: sql`marks.version + 1`,
        updatedAt: new Date(),
      },
    });
  return { examSubjectId: input.examSubjectId, studentId: input.studentId, total };
}

export async function submitMarks(
  schoolId: string,
  examSubjectId: string,
  sectionId: string,
  submittedBy: string,
) {
  const id = randomUUID();
  await db.insert(markSubmissions).values({
    id,
    schoolId,
    examSubjectId,
    sectionId,
    status: "submitted",
    submittedBy,
  });
  await db.update(marks).set({ status: "submitted" }).where(eq(marks.examSubjectId, examSubjectId));
  return { id, status: "submitted" };
}

export async function lockMarks(schoolId: string, examSubjectId: string, actorId: string) {
  await db.update(marks).set({ status: "locked" }).where(eq(marks.examSubjectId, examSubjectId));
  await writeAudit({
    scope: "school",
    schoolId,
    actorId,
    action: "marks.locked",
    entityType: "exam_subject",
    entityId: examSubjectId,
  });
  return { examSubjectId, status: "locked" };
}

export async function getMarks(schoolId: string, examSubjectId: string) {
  return db
    .select()
    .from(marks)
    .where(and(eq(marks.schoolId, schoolId), eq(marks.examSubjectId, examSubjectId)));
}

export interface ComputeResultsInput {
  schoolId: string;
  examId: string;
  actorId: string;
}

export async function computeResults(input: ComputeResultsInput) {
  // Get all exam subjects for this exam
  const subjects = await db
    .select()
    .from(examSubjects)
    .where(eq(examSubjects.examId, input.examId));
  // Get all marks for these subjects
  const allMarks: Array<{
    studentId: string;
    theoryMarks: string | null;
    practicalMarks: string | null;
    examSubject: (typeof subjects)[number];
  }> = [];
  for (const sub of subjects) {
    const m = await db.select().from(marks).where(eq(marks.examSubjectId, sub.id));
    allMarks.push(
      ...m.map((mark) => ({
        studentId: mark.studentId,
        theoryMarks: mark.theoryMarks,
        practicalMarks: mark.practicalMarks,
        examSubject: sub,
      })),
    );
  }
  // Group by student
  const studentMap = new Map<string, typeof allMarks>();
  for (const m of allMarks) {
    if (!studentMap.has(m.studentId)) studentMap.set(m.studentId, []);
    studentMap.get(m.studentId)!.push(m);
  }
  // Compute results
  const resultsList = [];
  for (const [studentId, studentMarks] of studentMap) {
    let totalMarks = 0;
    let maxTotal = 0;
    for (const m of studentMarks) {
      const theory = parseFloat(m.theoryMarks ?? "0");
      const practical = parseFloat(m.practicalMarks ?? "0");
      totalMarks += theory + practical;
      maxTotal += parseFloat(m.examSubject.maxMarks);
    }
    const percentage = maxTotal > 0 ? (totalMarks / maxTotal) * 100 : 0;
    const resultId = randomUUID();
    await db.insert(results).values({
      id: resultId,
      schoolId: input.schoolId,
      examId: input.examId,
      studentId,
      totalMarks: String(totalMarks),
      percentage: String(percentage.toFixed(2)),
      grade: null,
      resultStatus: percentage >= 33 ? "pass" : "fail",
      version: 1,
    });
    resultsList.push({ id: resultId, studentId, totalMarks, percentage: percentage.toFixed(2) });
  }
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "results.computed",
    entityType: "exam",
    entityId: input.examId,
    after: { studentCount: resultsList.length },
  });
  return resultsList;
}

export async function getResults(schoolId: string, examId: string) {
  return db
    .select()
    .from(results)
    .where(and(eq(results.schoolId, schoolId), eq(results.examId, examId)));
}

export interface CreateReportCardTemplateInput {
  schoolId: string;
  name: string;
  htmlTemplate: string;
  actorId: string;
}

export async function createReportCardTemplate(input: CreateReportCardTemplateInput) {
  const id = randomUUID();
  await db.insert(reportCardTemplates).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    htmlTemplate: input.htmlTemplate,
    version: 1,
    isActive: true,
  });
  return { id, name: input.name };
}

export async function listReportCardTemplates(schoolId: string) {
  return db.select().from(reportCardTemplates).where(eq(reportCardTemplates.schoolId, schoolId));
}
