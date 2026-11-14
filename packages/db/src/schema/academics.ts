import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    academicYearId: uuid("academic_year_id").notNull(),
    name: text("name").notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSchoolYearName: unique().on(t.schoolId, t.academicYearId, t.name),
  }),
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    classId: uuid("class_id").notNull(),
    name: text("name").notNull(),
    room: text("room"),
    capacity: integer("capacity"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueClassSection: unique().on(t.classId, t.name),
  }),
);

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    name: text("name").notNull(),
    code: text("code"),
    type: text("type").notNull().default("core"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSchoolSubject: unique().on(t.schoolId, t.name),
  }),
);

export const classSubjects = pgTable(
  "class_subjects",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    classId: uuid("class_id").notNull(),
    subjectId: uuid("subject_id").notNull(),
    isMandatory: boolean("is_mandatory").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueClassSubject: unique().on(t.classId, t.subjectId),
  }),
);

export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    teacherId: uuid("teacher_id").notNull(),
    sectionId: uuid("section_id").notNull(),
    subjectId: uuid("subject_id").notNull(),
    academicYearId: uuid("academic_year_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueAssignment: unique().on(t.teacherId, t.sectionId, t.subjectId, t.academicYearId),
  }),
);
