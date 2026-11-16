import {
  db,
  exam_terms,
  exams,
  exam_subjects,
  grading_schemes,
  grade_bands,
  marks,
  mark_submissions,
  results,
  report_card_templates,
  report_cards,
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

  await db.insert(exam_terms).values({
    id,
    schoolId: input.schoolId,
    academicYearId: input.academicYearId,
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status ?? "active",
    createdAt: now,
    updatedAt: now,
  });

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
  const rows = await db.select().from(exam_terms).where(eq(exam_terms.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listExamTerms(schoolId: string, academicYearId?: string) {
  const query = db.select().from(exam_terms).where(eq(exam_terms.schoolId, schoolId));
  if (academicYearId) {
    query.where(eq(exam_terms.academicYearId, academicYearId));
  }
  return query.orderBy(desc(exam_terms.startDate));
}

export async function updateExamTerm(id: string, input: any, actorId: string) {
  const existing = await getExamTerm(id);
  if (!existing) {
    throw new Error("Exam term not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.startDate !== undefined) updates.startDate = input.startDate;
  if (input.endDate !== undefined) updates.endDate = input.endDate;
  if (input.status !== undefined) updates.status = input.status;

  await db.update(exam_terms).set(updates).where(eq(exam_terms.id, id));
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
  const query = db.select().from(exams).where(eq(exams.schoolId, schoolId));
  if (termId) {
    query.where(eq(exams.termId, termId));
  }
  return query.orderBy(desc(exams.createdAt));
}

export async function updateExam(id: string, input: any, actorId: string) {
  const existing = await getExam(id);
  if (!existing) {
    throw new Error("Exam not found");
  }

  const updates: any = { updatedAt: new Date() };
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

  await db.insert(exam_subjects).values({
    id,
    schoolId: input.schoolId,
    examId: input.examId,
    classId: input.classId,
    subjectId: input.subjectId,
    maxMarks: input.maxMarks,
    passMarks: input.passMarks,
    theoryMax: input.theoryMax ?? null,
    practicalMax: input.practicalMax ?? null,
    weightage: input.weightage ?? null,
    createdAt: now,
    updatedAt: now,
  });

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
  const rows = await db.select().from(exam_subjects).where(eq(exam_subjects.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listExamSubjects(schoolId: string, examId?: string) {
  const query = db.select().from(exam_subjects).where(eq(exam_subjects.schoolId, schoolId));
  if (examId) {
    query.where(eq(exam_subjects.examId, examId));
  }
  return query.orderBy(exam_subjects.classId, exam_subjects.subjectId);
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

  await db.insert(grading_schemes).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    description: input.description ?? null,
    createdAt: now,
    updatedAt: now,
  });

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
  theoryMarks: number;
  practicalMarks?: number;
  status?: string;
  enteredBy: string;
  enteredAt?: Date;
}

export async function createMarks(input: CreateMarksInput) {
  const id = randomUUID();
  const now = input.enteredAt ?? new Date();

  // Calculate totals
  const theoryMax = input.practicalMarks ? 100 : 100; // Simplified
  const totalMarks = input.theoryMarks + (input.practicalMarks ?? 0);
  const percentage = (totalMarks / theoryMax) * 100;

  // Determine grade based on percentage
  const grade = determineGrade(percentage);

  // Determine result status
  const resultStatus = percentage >= 40 ? "passed" : "failed";

  await db.insert(marks).values({
    id,
    schoolId: input.schoolId,
    examSubjectId: input.examSubjectId,
    studentId: input.studentId,
    theoryMarks: input.theoryMarks,
    practicalMarks: input.practicalMarks ?? null,
    totalMarks,
    percentage,
    grade,
    resultStatus,
    status: input.status ?? "draft",
    enteredBy: input.enteredBy,
    enteredAt: now,
    createdAt: now,
    updatedAt: now,
  });

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
  const query = db.select().from(marks).where(eq(marks.schoolId, schoolId));
  if (examSubjectId) {
    query.where(eq(marks.examSubjectId, examSubjectId));
  }
  if (studentId) {
    query.where(eq(marks.studentId, studentId));
  }
  return query.orderBy(desc(marks.createdAt));
}

export async function updateMarks(id: string, input: any, actorId: string) {
  const existing = await getMarks(id);
  if (!existing) {
    throw new Error("Marks not found");
  }

  const updates: any = { updatedAt: new Date() };
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
  totalMarks: number;
  percentage: number;
  grade: string;
  resultStatus: string;
  version?: number;
  actorId: string;
}

export async function createResult(input: CreateResultInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(results).values({
    id,
    schoolId: input.schoolId,
    examId: input.examId,
    studentId: input.studentId,
    totalMarks: input.totalMarks,
    percentage: input.percentage,
    grade: input.grade,
    resultStatus: input.resultStatus,
    version: input.version ?? 1,
    createdAt: now,
    updatedAt: now,
  });

  return { id, studentId: input.studentId, totalMarks: input.totalMarks, percentage: input.percentage, grade: input.grade };
}

export async function getResult(id: string) {
  const rows = await db.select().from(results).where(eq(results.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listResults(schoolId: string, examId?: string, studentId?: string) {
  const query = db.select().from(results).where(eq(results.schoolId, schoolId));
  if (examId) {
    query.where(eq(results.examId, examId));
  }
  if (studentId) {
    query.where(eq(results.studentId, studentId));
  }
  return query.orderBy(desc(results.percentage));
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

  await db.insert(report_card_templates).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    htmlTemplate: input.htmlTemplate,
    version: input.version ?? 1,
    isDefault: input.isDefault ?? false,
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
  });

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

  await db.insert(report_cards).values({
    id,
    schoolId: input.schoolId,
    examId: input.examId,
    studentId: input.studentId,
    templateId: input.templateId,
    objectPath: input.objectPath,
    status: input.status ?? "draft",
    publishedAt: input.publishedAt ?? null,
    version: input.version ?? 1,
    createdAt: now,
    updatedAt: now,
  });

  return { id, studentId: input.studentId, status: input.status ?? "draft" };
}

export async function getReportCard(id: string) {
  const rows = await db.select().from(report_cards).where(eq(report_cards.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listReportCards(schoolId: string, examId?: string, studentId?: string) {
  const query = db.select().from(report_cards).where(eq(report_cards.schoolId, schoolId));
  if (examId) {
    query.where(eq(report_cards.examId, examId));
  }
  if (studentId) {
    query.where(eq(report_cards.studentId, studentId));
  }
  return query.orderBy(desc(report_cards.createdAt));
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

  await db.insert(mark_submissions).values({
    id,
    schoolId: input.schoolId,
    examSubjectId: input.examSubjectId,
    sectionId: input.sectionId,
    totalSubmitted: 0, // Will be calculated from marks
    status: input.status ?? "submitted",
    submittedBy: input.submittedBy,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { id, examSubjectId: input.examSubjectId, status: input.status ?? "submitted" };
}

export async function getMarkSubmission(id: string) {
  const rows = await db.select().from(mark_submissions).where(eq(mark_submissions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listMarkSubmissions(schoolId: string, examSubjectId?: string) {
  const query = db.select().from(mark_submissions).where(eq(mark_submissions.schoolId, schoolId));
  if (examSubjectId) {
    query.where(eq(mark_submissions.examSubjectId, examSubjectId));
  }
  return query.orderBy(desc(mark_submissions.createdAt));
}
