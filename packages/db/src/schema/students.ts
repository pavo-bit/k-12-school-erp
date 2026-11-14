import { pgTable, text, timestamp, uuid, date, boolean, unique, index } from "drizzle-orm/pg-core";

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    admissionNumber: text("admission_number").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    gender: text("gender").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => ({
    uniqueSchoolAdmission: unique().on(t.schoolId, t.admissionNumber),
    uniqueSchoolId: unique().on(t.schoolId, t.id),
  }),
);

export const guardians = pgTable("guardians", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  occupation: text("occupation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentGuardians = pgTable(
  "student_guardians",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    studentId: uuid("student_id").notNull(),
    guardianId: uuid("guardian_id").notNull(),
    relationship: text("relationship").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    canPay: boolean("can_pay").notNull().default(true),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueStudentGuardian: unique().on(t.studentId, t.guardianId),
  }),
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    studentId: uuid("student_id").notNull(),
    academicYearId: uuid("academic_year_id").notNull(),
    classId: uuid("class_id").notNull(),
    sectionId: uuid("section_id").notNull(),
    rollNumber: text("roll_number"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueStudentYear: unique().on(t.studentId, t.academicYearId),
    uniqueSchoolId: unique().on(t.schoolId, t.id),
  }),
);

export const studentDocuments = pgTable("student_documents", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  documentType: text("document_type").notNull(),
  objectPath: text("object_path").notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentConsents = pgTable("student_consents", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  guardianId: uuid("guardian_id").notNull(),
  purpose: text("purpose").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
});
