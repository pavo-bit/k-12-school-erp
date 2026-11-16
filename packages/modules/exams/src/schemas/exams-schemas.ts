import { z } from "zod";

// Exam Term schemas
export const CreateExamTermSchema = z.object({
  schoolId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["active", "closed", "completed"]).default("active"),
  actorId: z.string(),
});

export const UpdateExamTermSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["active", "closed", "completed"]).optional(),
});

export const ExamTermResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Exam schemas
export const CreateExamSchema = z.object({
  schoolId: z.string().uuid(),
  termId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(["theory", "practical", "both", "internal", "external"]),
  status: z.enum(["draft", "scheduled", "conducted", "completed"]).default("draft"),
  actorId: z.string(),
});

export const UpdateExamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["theory", "practical", "both", "internal", "external"]).optional(),
  status: z.enum(["draft", "scheduled", "conducted", "completed"]).optional(),
});

export const ExamResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  termId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Exam Subject schemas
export const CreateExamSubjectSchema = z.object({
  schoolId: z.string().uuid(),
  examId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  maxMarks: z.number().int().min(0),
  passMarks: z.number().int().min(0),
  theoryMax: z.number().int().min(0).optional(),
  practicalMax: z.number().int().min(0).optional(),
  weightage: z.number().min(0).max(100).optional(),
  actorId: z.string(),
});

export const UpdateExamSubjectSchema = z.object({
  maxMarks: z.number().int().min(0).optional(),
  passMarks: z.number().int().min(0).optional(),
  theoryMax: z.number().int().min(0).optional(),
  practicalMax: z.number().int().min(0).optional(),
  weightage: z.number().min(0).max(100).optional(),
});

export const ExamSubjectResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  examId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  maxMarks: z.number(),
  passMarks: z.number(),
  theoryMax: z.number().nullable(),
  practicalMax: z.number().nullable(),
  weightage: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Grading Scheme schemas
export const CreateGradingSchemeSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  actorId: z.string(),
});

export const CreateGradeBandSchema = z.object({
  gradingSchemeId: z.string().uuid(),
  grade: z.string().min(1).max(10),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  gradePoint: z.number().min(0).max(10).optional(),
  comment: z.string().max(200).optional(),
  actorId: z.string(),
});

export const GradingSchemeResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Marks schemas
export const CreateMarksSchema = z.object({
  schoolId: z.string().uuid(),
  examSubjectId: z.string().uuid(),
  studentId: z.string().uuid(),
  theoryMarks: z.number().min(0),
  practicalMarks: z.number().min(0).optional(),
  status: z.enum(["draft", "submitted", "approved"]).default("draft"),
  enteredBy: z.string(),
  enteredAt: z.string().datetime(),
});

export const UpdateMarksSchema = z.object({
  theoryMarks: z.number().min(0).optional(),
  practicalMarks: z.number().min(0).optional(),
  status: z.enum(["draft", "submitted", "approved"]).optional(),
  enteredBy: z.string().optional(),
  enteredAt: z.string().datetime().optional(),
});

export const MarksResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  examSubjectId: z.string().uuid(),
  studentId: z.string().uuid(),
  theoryMarks: z.number(),
  practicalMarks: z.number().nullable(),
  totalMarks: z.number(),
  percentage: z.number(),
  grade: z.string(),
  resultStatus: z.string(),
  status: z.string(),
  enteredBy: z.string(),
  enteredAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Result schemas
export const CreateResultSchema = z.object({
  schoolId: z.string().uuid(),
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  totalMarks: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  grade: z.string(),
  resultStatus: z.enum(["passed", "failed", "conditional"]),
  version: z.number().int().min(1).default(1),
  actorId: z.string(),
});

export const UpdateResultSchema = z.object({
  totalMarks: z.number().int().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  grade: z.string().optional(),
  resultStatus: z.enum(["passed", "failed", "conditional"]).optional(),
  version: z.number().int().min(1).optional(),
});

export const ResultResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  totalMarks: z.number(),
  percentage: z.number(),
  grade: z.string(),
  resultStatus: z.string(),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Report Card Template schemas
export const CreateReportCardTemplateSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(200),
  htmlTemplate: z.string().min(1),
  version: z.number().int().min(1).default(1),
  isDefault: z.boolean().default(false),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  actorId: z.string(),
});

export const UpdateReportCardTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  htmlTemplate: z.string().min(1).optional(),
  version: z.number().int().min(1).optional(),
  isDefault: z.boolean().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

export const ReportCardTemplateResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  htmlTemplate: z.string(),
  version: z.number(),
  isDefault: z.boolean(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Report Card schemas
export const CreateReportCardSchema = z.object({
  schoolId: z.string().uuid(),
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  templateId: z.string().uuid(),
  objectPath: z.string(),
  status: z.enum(["draft", "generated", "published", "archived"]).default("draft"),
  publishedAt: z.string().datetime().optional(),
  version: z.number().int().min(1).default(1),
  actorId: z.string(),
});

export const ReportCardResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  templateId: z.string().uuid(),
  objectPath: z.string(),
  status: z.string(),
  publishedAt: z.date().nullable(),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Mark Submission schemas
export const CreateMarkSubmissionSchema = z.object({
  schoolId: z.string().uuid(),
  examSubjectId: z.string().uuid(),
  sectionId: z.string().uuid(),
  status: z.enum(["draft", "submitted", "approved"]),
  submittedBy: z.string(),
  submittedAt: z.string().datetime(),
});

export const MarkSubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  examSubjectId: z.string().uuid(),
  sectionId: z.string().uuid(),
  totalSubmitted: z.number(),
  status: z.string(),
  submittedBy: z.string(),
  submittedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
