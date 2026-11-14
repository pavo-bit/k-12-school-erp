import { db, students, guardians, studentGuardians, enrollments } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

export interface CreateStudentInput {
  schoolId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  actorId: string;
}

export async function createStudent(input: CreateStudentInput) {
  const id = randomUUID();
  await db.insert(students).values({
    id,
    schoolId: input.schoolId,
    admissionNumber: input.admissionNumber,
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    status: "active",
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "student.created",
    entityType: "student",
    entityId: id,
    after: {
      admissionNumber: input.admissionNumber,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });
  return {
    id,
    admissionNumber: input.admissionNumber,
    firstName: input.firstName,
    lastName: input.lastName,
  };
}

export async function listStudents(schoolId: string, search?: string) {
  const rows = await db.select().from(students).where(eq(students.schoolId, schoolId));
  if (search) {
    const q = search.toLowerCase();
    return rows.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q),
    );
  }
  return rows;
}

export async function getStudent(schoolId: string, studentId: string) {
  const rows = await db
    .select()
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.id, studentId)))
    .limit(1);
  return rows[0] ?? null;
}

export interface CreateGuardianInput {
  name: string;
  phone: string;
  email?: string;
  occupation?: string;
}

export async function createGuardian(input: CreateGuardianInput) {
  const id = randomUUID();
  await db.insert(guardians).values({
    id,
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    occupation: input.occupation ?? null,
  });
  return { id, name: input.name, phone: input.phone };
}

export async function linkGuardian(
  schoolId: string,
  studentId: string,
  guardianId: string,
  relationship: string,
  isPrimary: boolean,
) {
  const id = randomUUID();
  await db.insert(studentGuardians).values({
    id,
    schoolId,
    studentId,
    guardianId,
    relationship,
    isPrimary,
    canPay: true,
    status: "active",
  });
  return { id };
}

export interface CreateEnrollmentInput {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  rollNumber?: string;
  actorId: string;
}

export async function createEnrollment(input: CreateEnrollmentInput) {
  const id = randomUUID();
  await db.insert(enrollments).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    academicYearId: input.academicYearId,
    classId: input.classId,
    sectionId: input.sectionId,
    rollNumber: input.rollNumber ?? null,
    status: "active",
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "enrollment.created",
    entityType: "enrollment",
    entityId: id,
    after: { studentId: input.studentId, classId: input.classId, sectionId: input.sectionId },
  });
  return { id };
}
