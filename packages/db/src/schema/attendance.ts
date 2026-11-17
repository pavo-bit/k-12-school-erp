import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  time,
  integer,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const holidays = pgTable("holidays", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  date: date("date").notNull(),
  name: text("name").notNull(),
  appliesTo: text("applies_to").notNull().default("all"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const periods = pgTable("periods", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  name: text("name").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const timetableSlots = pgTable(
  "timetable_slots",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    sectionId: uuid("section_id").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    periodId: uuid("period_id").notNull(),
    subjectId: uuid("subject_id").notNull(),
    teacherId: uuid("teacher_id").notNull(),
    room: text("room"),
    roomId: uuid("room_id"),
    effectiveFrom: date("effective_from").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // One subject per section per period; no teacher double-booked, no room double-booked.
    uniqueSectionDayPeriod: unique().on(t.schoolId, t.sectionId, t.dayOfWeek, t.periodId),
    uniqueTeacherDayPeriod: unique().on(t.schoolId, t.teacherId, t.dayOfWeek, t.periodId),
    // NULLs are distinct in Postgres unique indexes — free-text/unset rooms stay allowed.
    uniqueRoomDayPeriod: unique().on(t.schoolId, t.roomId, t.dayOfWeek, t.periodId),
  }),
);

export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    sectionId: uuid("section_id").notNull(),
    date: date("date").notNull(),
    sessionType: text("session_type").notNull().default("daily"),
    status: text("status").notNull().default("draft"),
    submittedBy: uuid("submitted_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSectionDateSession: unique().on(t.sectionId, t.date, t.sessionType),
  }),
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    studentId: uuid("student_id").notNull(),
    status: text("status").notNull(),
    markedBy: uuid("marked_by"),
    markedAt: timestamp("marked_at", { withTimezone: true }),
    source: text("source").notNull().default("web"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSessionStudent: unique().on(t.sessionId, t.studentId),
  }),
);

export const attendanceCorrections = pgTable("attendance_corrections", {
  id: uuid("id").primaryKey(),
  attendanceRecordId: uuid("attendance_record_id").notNull(),
  oldStatus: text("old_status").notNull(),
  newStatus: text("new_status").notNull(),
  reason: text("reason").notNull(),
  actorId: uuid("actor_id").notNull(),
  approvedBy: uuid("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staffAttendance = pgTable(
  "staff_attendance",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    staffId: uuid("staff_id").notNull(),
    date: date("date").notNull(),
    status: text("status").notNull(),
    source: text("source").notNull().default("web"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueStaffDate: unique().on(t.staffId, t.date),
  }),
);

export const syncOperations = pgTable("sync_operations", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  deviceId: text("device_id").notNull(),
  operationId: text("operation_id").notNull().unique(),
  status: text("status").notNull().default("pending"),
  result: text("result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
