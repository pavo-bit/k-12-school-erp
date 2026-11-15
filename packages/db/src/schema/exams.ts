import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  integer,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const examTerms = pgTable("exam_terms", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  academicYearId: uuid("academic_year_id").notNull(),
  name: text("name").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exams = pgTable("exams", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  termId: uuid("term_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const examSubjects = pgTable("exam_subjects", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  examId: uuid("exam_id").notNull(),
  classId: uuid("class_id").notNull(),
  subjectId: uuid("subject_id").notNull(),
  maxMarks: text("max_marks").notNull(),
  passMarks: text("pass_marks").notNull(),
  theoryMax: text("theory_max"),
  practicalMax: text("practical_max"),
  weightage: integer("weightage").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gradingSchemes = pgTable("grading_schemes", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gradeBands = pgTable("grade_bands", {
  id: uuid("id").primaryKey(),
  gradingSchemeId: uuid("grading_scheme_id").notNull(),
  minPercentage: text("min_percentage").notNull(),
  maxPercentage: text("max_percentage").notNull(),
  grade: text("grade").notNull(),
  gradePoint: text("grade_point"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marks = pgTable(
  "marks",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    examSubjectId: uuid("exam_subject_id").notNull(),
    studentId: uuid("student_id").notNull(),
    theoryMarks: text("theory_marks"),
    practicalMarks: text("practical_marks"),
    status: text("status").notNull().default("draft"),
    enteredBy: uuid("entered_by"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueExamSubjectStudent: unique().on(t.examSubjectId, t.studentId),
  }),
);

export const markSubmissions = pgTable("mark_submissions", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  examSubjectId: uuid("exam_subject_id").notNull(),
  sectionId: uuid("section_id").notNull(),
  status: text("status").notNull().default("draft"),
  submittedBy: uuid("submitted_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    examId: uuid("exam_id").notNull(),
    studentId: uuid("student_id").notNull(),
    totalMarks: text("total_marks").notNull(),
    percentage: text("percentage").notNull(),
    grade: text("grade"),
    resultStatus: text("result_status").notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueExamStudent: unique().on(t.examId, t.studentId),
  }),
);

export const reportCardTemplates = pgTable("report_card_templates", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  name: text("name").notNull(),
  htmlTemplate: text("html_template").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportCards = pgTable("report_cards", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  examId: uuid("exam_id").notNull(),
  studentId: uuid("student_id").notNull(),
  templateVersion: integer("template_version").notNull(),
  objectPath: text("object_path"),
  status: text("status").notNull().default("generated"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
