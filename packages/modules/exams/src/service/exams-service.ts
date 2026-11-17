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
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Exam Term operations
export interface CreateExamTermInput {
  schoolId: string;
  academicYearId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status?: string;
  actorId: string;
}

export async function createExamTerm(input: CreateExamTermInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(examTerms).values([
    {
      id,
      schoolId: input.schoolId,
      academicYearId: input.academicYearId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  ]);

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "exam_term.created",
    entityType: "exam_term",
    entityId: id,
    after: { name: input.name, startDate: input.startDate, endDate: input.endDate },
  });

  return { id, name: input.name, startDate: input.startDate, endDate: input.endDate };
}

export async function getExamTerm(id: string) {
  const rows = await db.select().from(examTerms).where(eq(examTerms.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listExamTerms(schoolId: string, academicYearId?: string) {
  const conditions = [eq(examTerms.schoolId, schoolId)];
  if (academicYearId) conditions.push(eq(examTerms.academicYearId, academicYearId));
  return db
    .select()
    .from(examTerms)
    .where(and(...conditions))
    .orderBy(desc(examTerms.startDate));
}

export async function updateExamTerm(id: string, input: Record<string, unknown>, actorId: string) {
  const existing = await getExamTerm(id);
  if (!existing) {
    throw new Error("Exam term not found");
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.startDate !== undefined) updates.startDate = input.startDate;
  if (input.endDate !== undefined) updates.endDate = input.endDate;
  if (input.status !== undefined) updates.status = input.status;

  await db.update(examTerms).set(updates).where(eq(examTerms.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "exam_term.updated",
    entityType: "exam_term",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Exam operations
export interface CreateExamInput {
  schoolId: string;
  termId: string;
  name: string;
  type: string;
  status?: string;
  actorId: string;
}

export async function createExam(input: CreateExamInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(exams).values({
    id,
    schoolId: input.schoolId,
    termId: input.termId,
    name: input.name,
    type: input.type,
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
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

  return { id, name: input.name, type: input.type };
}

export async function getExam(id: string) {
  const rows = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listExams(schoolId: string, termId?: string) {
  const conditions = [eq(exams.schoolId, schoolId)];
  if (termId) conditions.push(eq(exams.termId, termId));
  return db
    .select()
    .from(exams)
    .where(and(...conditions))
    .orderBy(desc(exams.createdAt));
}

export async function updateExam(id: string, input: Record<string, unknown>, actorId: string) {
  const existing = await getExam(id);
  if (!existing) {
    throw new Error("Exam not found");
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.type !== undefined) updates.type = input.type;
  if (input.status !== undefined) updates.status = input.status;

  await db.update(exams).set(updates).where(eq(exams.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "exam.updated",
    entityType: "exam",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Exam Subject operations
export interface CreateExamSubjectInput {
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

export async function createExamSubject(input: CreateExamSubjectInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(examSubjects).values([
    {
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
    },
  ]);

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "exam_subject.created",
    entityType: "exam_subject",
    entityId: id,
    after: { examId: input.examId, classId: input.classId, subjectId: input.subjectId },
  });

  return { id, examId: input.examId, classId: input.classId, subjectId: input.subjectId };
}

export async function getExamSubject(id: string) {
  const rows = await db.select().from(examSubjects).where(eq(examSubjects.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listExamSubjects(schoolId: string, examId?: string) {
  const conditions = [eq(examSubjects.schoolId, schoolId)];
  if (examId) conditions.push(eq(examSubjects.examId, examId));
  return db
    .select()
    .from(examSubjects)
    .where(and(...conditions))
    .orderBy(examSubjects.classId, examSubjects.subjectId);
}

// Grading Scheme operations
export interface CreateGradingSchemeInput {
  schoolId: string;
  name: string;
  description?: string;
  actorId: string;
}

export async function createGradingScheme(input: CreateGradingSchemeInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(gradingSchemes).values([
    {
      id,
      schoolId: input.schoolId,
      name: input.name,
    },
  ]);

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "grading_scheme.created",
    entityType: "grading_scheme",
    entityId: id,
    after: { name: input.name },
  });

  return { id, name: input.name };
}

// Marks operations
export interface CreateMarksInput {
  schoolId: string;
  examSubjectId: string;
  studentId: string;
  theoryMarks?: number | undefined;
  practicalMarks?: number | undefined;
  status?: string;
  enteredBy: string;
  enteredAt?: Date;
}

export async function createMarks(input: CreateMarksInput) {
  const id = randomUUID();
  const now = input.enteredAt ?? new Date();

  // Calculate totals
  const theoryMax = input.practicalMarks ? 100 : 100; // Simplified
  const totalMarks = (input.theoryMarks ?? 0) + (input.practicalMarks ?? 0);
  const percentage = (totalMarks / theoryMax) * 100;

  // Determine grade based on percentage
  const grade = determineGrade(percentage);

  // Determine result status
  const resultStatus = percentage >= 40 ? "passed" : "failed";

  await db.insert(marks).values([
    {
      id,
      schoolId: input.schoolId,
      examSubjectId: input.examSubjectId,
      studentId: input.studentId,
      theoryMarks: input.theoryMarks != null ? String(input.theoryMarks) : null,
      practicalMarks: input.practicalMarks != null ? String(input.practicalMarks) : null,
      status: input.status ?? "draft",
      enteredBy: input.enteredBy,
      version: 1,
    },
  ]);

  return { id, studentId: input.studentId, totalMarks, percentage, grade, resultStatus };
}

function determineGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 33) return "D";
  return "F";
}

export async function getMarks(id: string) {
  const rows = await db.select().from(marks).where(eq(marks.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listMarks(schoolId: string, examSubjectId?: string, studentId?: string) {
  const conditions = [eq(marks.schoolId, schoolId)];
  if (examSubjectId) conditions.push(eq(marks.examSubjectId, examSubjectId));
  if (studentId) conditions.push(eq(marks.studentId, studentId));
  return db
    .select()
    .from(marks)
    .where(and(...conditions))
    .orderBy(desc(marks.createdAt));
}

export async function updateMarks(id: string, input: Record<string, unknown>, actorId: string) {
  const existing = await getMarks(id);
  if (!existing) {
    throw new Error("Marks not found");
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.theoryMarks !== undefined) updates.theoryMarks = input.theoryMarks;
  if (input.practicalMarks !== undefined) updates.practicalMarks = input.practicalMarks;
  if (input.status !== undefined) updates.status = input.status;
  if (input.enteredBy !== undefined) updates.enteredBy = input.enteredBy;

  await db.update(marks).set(updates).where(eq(marks.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "marks.updated",
    entityType: "marks",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Result operations
export interface CreateResultInput {
  schoolId: string;
  examId: string;
  studentId: string;
  totalMarks: string;
  percentage: string;
  grade: string;
  resultStatus: string;
  version?: number;
  actorId: string;
}

export async function createResult(input: CreateResultInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(results as unknown as Parameters<typeof db.insert>[0]).values([
    {
      id,
      schoolId: input.schoolId,
      examId: input.examId,
      studentId: input.studentId,
      totalMarks: String(input.totalMarks),
      percentage: String(input.percentage),
      grade: input.grade ?? null,
      resultStatus: input.resultStatus,
      version: input.version ?? 1,
    },
  ]);

  return {
    id,
    studentId: input.studentId,
    totalMarks: input.totalMarks,
    percentage: input.percentage,
    grade: input.grade,
  };
}

export async function getResult(id: string) {
  const rows = await db.select().from(results).where(eq(results.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listResults(schoolId: string, examId?: string, studentId?: string) {
  const conditions = [eq(results.schoolId, schoolId)];
  if (examId) conditions.push(eq(results.examId, examId));
  if (studentId) conditions.push(eq(results.studentId, studentId));
  return db
    .select()
    .from(results)
    .where(and(...conditions))
    .orderBy(desc(results.percentage));
}

// Report Card Template operations
export interface CreateReportCardTemplateInput {
  schoolId: string;
  name: string;
  htmlTemplate: string;
  version?: number;
  isDefault?: boolean;
  status?: string;
  actorId: string;
}

export async function createReportCardTemplate(input: CreateReportCardTemplateInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(reportCardTemplates).values([
    {
      id,
      schoolId: input.schoolId,
      name: input.name,
      htmlTemplate: input.htmlTemplate,
      version: input.version ?? 1,
      isActive: true,
    },
  ]);

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "report_card_template.created",
    entityType: "report_card_template",
    entityId: id,
    after: { name: input.name },
  });

  return { id, name: input.name };
}

// Report Card operations
export interface CreateReportCardInput {
  schoolId: string;
  examId: string;
  studentId: string;
  templateId: string;
  objectPath: string;
  status?: string;
  publishedAt?: Date;
  version?: number;
  actorId: string;
}

export async function createReportCard(input: CreateReportCardInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(reportCards).values([
    {
      id,
      schoolId: input.schoolId,
      examId: input.examId,
      studentId: input.studentId,
      templateVersion: parseInt(input.templateId ?? "1", 10),
      objectPath: input.objectPath ?? null,
      status: input.status ?? "draft",
      publishedAt: input.publishedAt ?? null,
      version: input.version ?? 1,
    },
  ]);

  return { id, studentId: input.studentId, status: input.status ?? "draft" };
}

export async function getReportCard(id: string) {
  const rows = await db.select().from(reportCards).where(eq(reportCards.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listReportCards(schoolId: string, examId?: string, studentId?: string) {
  const conditions = [eq(reportCards.schoolId, schoolId)];
  if (examId) conditions.push(eq(reportCards.examId, examId));
  if (studentId) conditions.push(eq(reportCards.studentId, studentId));
  return db
    .select()
    .from(reportCards)
    .where(and(...conditions))
    .orderBy(desc(reportCards.createdAt));
}

// Mark Submission operations
export interface CreateMarkSubmissionInput {
  schoolId: string;
  examSubjectId: string;
  sectionId: string;
  status?: string;
  submittedBy: string;
  submittedAt?: Date;
}

export async function createMarkSubmission(input: CreateMarkSubmissionInput) {
  const id = randomUUID();
  const now = input.submittedAt ?? new Date();

  await db.insert(markSubmissions).values([
    {
      id,
      schoolId: input.schoolId,
      examSubjectId: input.examSubjectId,
      sectionId: input.sectionId,
      status: input.status ?? "submitted",
      submittedBy: input.submittedBy,
    },
  ]);

  return { id, examSubjectId: input.examSubjectId, status: input.status ?? "submitted" };
}

export async function getMarkSubmission(id: string) {
  const rows = await db.select().from(markSubmissions).where(eq(markSubmissions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listMarkSubmissions(schoolId: string, examSubjectId?: string) {
  const conditions = [eq(markSubmissions.schoolId, schoolId)];
  if (examSubjectId) conditions.push(eq(markSubmissions.examSubjectId, examSubjectId));
  return db
    .select()
    .from(markSubmissions)
    .where(and(...conditions))
    .orderBy(desc(markSubmissions.createdAt));
}
