import { db, classes, sections, subjects, classSubjects, academicYears } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

export interface CreateClassInput {
  schoolId: string;
  academicYearId: string;
  name: string;
  order: number;
  actorId: string;
}

export async function createClass(input: CreateClassInput) {
  const id = randomUUID();
  await db.insert(classes).values({
    id,
    schoolId: input.schoolId,
    academicYearId: input.academicYearId,
    name: input.name,
    order: input.order,
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "class.created",
    entityType: "class",
    entityId: id,
    after: { name: input.name },
  });
  return { id, name: input.name };
}

export async function listClasses(schoolId: string, academicYearId?: string) {
  if (academicYearId) {
    return db
      .select()
      .from(classes)
      .where(and(eq(classes.schoolId, schoolId), eq(classes.academicYearId, academicYearId)));
  }
  return db.select().from(classes).where(eq(classes.schoolId, schoolId));
}

export interface CreateSectionInput {
  schoolId: string;
  classId: string;
  name: string;
  room?: string | undefined;
  capacity?: number | undefined;
  actorId: string;
}

export async function createSection(input: CreateSectionInput) {
  const id = randomUUID();
  await db.insert(sections).values({
    id,
    schoolId: input.schoolId,
    classId: input.classId,
    name: input.name,
    room: input.room ?? null,
    capacity: input.capacity ?? null,
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "section.created",
    entityType: "section",
    entityId: id,
    after: { name: input.name, classId: input.classId },
  });
  return { id, name: input.name };
}

export async function listSections(schoolId: string, classId?: string) {
  if (classId) {
    return db
      .select()
      .from(sections)
      .where(and(eq(sections.schoolId, schoolId), eq(sections.classId, classId)));
  }
  return db.select().from(sections).where(eq(sections.schoolId, schoolId));
}

export interface CreateSubjectInput {
  schoolId: string;
  name: string;
  code?: string | undefined;
  type: string;
  actorId: string;
}

export async function createSubject(input: CreateSubjectInput) {
  const id = randomUUID();
  await db.insert(subjects).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    code: input.code ?? null,
    type: input.type,
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "subject.created",
    entityType: "subject",
    entityId: id,
    after: { name: input.name },
  });
  return { id, name: input.name };
}

export async function listSubjects(schoolId: string) {
  return db.select().from(subjects).where(eq(subjects.schoolId, schoolId));
}

export async function assignSubjectToClass(
  schoolId: string,
  classId: string,
  subjectId: string,
  isMandatory: boolean,
) {
  const id = randomUUID();
  await db.insert(classSubjects).values({
    id,
    schoolId,
    classId,
    subjectId,
    isMandatory,
  });
  return { id };
}

export async function getActiveAcademicYear(schoolId: string) {
  const rows = await db.select().from(academicYears).where(eq(academicYears.schoolId, schoolId));
  return rows.find((y) => y.status === "active") ?? rows[0] ?? null;
}
