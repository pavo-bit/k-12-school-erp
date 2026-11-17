import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  integer,
  boolean,
  bigint,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const dailyAttendanceSummaries = pgTable(
  "daily_attendance_summaries",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    sectionId: uuid("section_id").notNull(),
    date: date("date").notNull(),
    presentCount: integer("present_count").notNull().default(0),
    absentCount: integer("absent_count").notNull().default(0),
    totalCount: integer("total_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSectionDate: unique().on(t.schoolId, t.sectionId, t.date),
  }),
);

export const dailyFeeSummaries = pgTable(
  "daily_fee_summaries",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    academicYearId: uuid("academic_year_id").notNull(),
    date: date("date").notNull(),
    collectedPaise: bigint("collected_paise", { mode: "number" }).notNull().default(0),
    outstandingPaise: bigint("outstanding_paise", { mode: "number" }).notNull().default(0),
    invoiceCount: integer("invoice_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSchoolDate: unique().on(t.schoolId, t.academicYearId, t.date),
  }),
);

export const enrollmentSnapshots = pgTable(
  "enrollment_snapshots",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    academicYearId: uuid("academic_year_id").notNull(),
    classId: uuid("class_id").notNull(),
    sectionId: uuid("section_id"),
    studentCount: integer("student_count").notNull().default(0),
    snapshotDate: date("snapshot_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSnapshot: unique().on(
      t.schoolId,
      t.academicYearId,
      t.classId,
      t.sectionId,
      t.snapshotDate,
    ),
  }),
);

export const reportJobs = pgTable("report_jobs", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  reportType: text("report_type").notNull(),
  status: text("status").notNull().default("pending"),
  objectPath: text("object_path"),
  requestedBy: uuid("requested_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const scheduledReports = pgTable("scheduled_reports", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  reportType: text("report_type").notNull(),
  frequency: text("frequency").notNull(),
  recipients: text("recipients").notNull(),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
