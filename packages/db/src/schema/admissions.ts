import { pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";

export const enquiries = pgTable("enquiries", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  studentName: text("student_name").notNull(),
  guardianPhone: text("guardian_phone").notNull(),
  classSought: text("class_sought").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  enquiryId: uuid("enquiry_id"),
  academicYearId: uuid("academic_year_id").notNull(),
  status: text("status").notNull().default("submitted"),
  convertedStudentId: uuid("converted_student_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applicationNotes = pgTable("application_notes", {
  id: uuid("id").primaryKey(),
  applicationId: uuid("application_id").notNull(),
  note: text("note").notNull(),
  actorId: uuid("actor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const admissionStatusHistory = pgTable("admission_status_history", {
  id: uuid("id").primaryKey(),
  applicationId: uuid("application_id").notNull(),
  status: text("status").notNull(),
  actorId: uuid("actor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
