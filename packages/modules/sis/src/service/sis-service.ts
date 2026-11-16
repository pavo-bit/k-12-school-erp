import { db, students, guardians, student_guardians, enrollments, student_documents, student_consents } from "@school-erp/db";
import { eq, and, desc, sql, ilike } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Student operations
export interface CreateStudentInput {
  schoolId: string;
  admissionNumber: string;
  firstName: string;
  lastName?: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  email?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  category?: string;
  religion?: string;
  caste?: string;
  guardianId?: string;
  status?: string;
  actorId: string;
}

export async function createStudent(input: CreateStudentInput) {
  const id = randomUUID();
  await db.insert(students).values({
    id,
    schoolId: input.schoolId,
    admissionNumber: input.admissionNumber,
    firstName: input.firstName,
    lastName: input.lastName ?? null,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    bloodGroup: input.bloodGroup ?? null,
    category: input.category ?? null,
    religion: input.religion ?? null,
    caste: input.caste ?? null,
    status: input.status ?? "active",
  });

  // Link guardian if provided
  if (input.guardianId) {
    await db.insert(student_guardians).values({
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: id,
      guardianId: input.guardianId,
      relationship: "parent",
      isPrimary: true,
      canPay: true,
      status: "active",
    });
  }

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
      dateOfBirth: input.dateOfBirth,
    },
  });

  return { id, admissionNumber: input.admissionNumber, firstName: input.firstName, lastName: input.lastName };
}

export async function getStudent(id: string) {
  const rows = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getStudentByAdmissionNumber(schoolId: string, admissionNumber: string) {
  const rows = await db.select().from(students).where(eq(students.schoolId, schoolId), eq(students.admissionNumber, admissionNumber)).limit(1);
  return rows[0] ?? null;
}

export async function listStudents(schoolId: string, filters?: any, pagination?: { page: number; limit: number }) {
  const query = db.select().from(students).where(eq(students.schoolId, schoolId));

  // Apply filters
  if (filters?.status) {
    query.where(sql`${students.status} = ${filters.status}`);
  }
  if (filters?.gender) {
    query.where(sql`${students.gender} = ${filters.gender}`);
  }
  if (filters?.classId) {
    // Need to join with enrollments
    query.where(sql`${students.id} IN (SELECT student_id FROM enrollments WHERE class_id = ${filters.classId} AND status = 'active')`);
  }

  // Apply pagination
  if (pagination) {
    const offset = (pagination.page - 1) * pagination.limit;
    return query.limit(pagination.limit).offset(offset).orderBy(desc(students.createdAt));
  }

  return query.orderBy(desc(students.createdAt));
}

export async function updateStudent(id: string, input: any, actorId: string) {
  const existing = await getStudent(id);
  if (!existing) {
    throw new Error("Student not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.firstName !== undefined) updates.firstName = input.firstName;
  if (input.lastName !== undefined) updates.lastName = input.lastName;
  if (input.dateOfBirth !== undefined) updates.dateOfBirth = input.dateOfBirth;
  if (input.gender !== undefined) updates.gender = input.gender;
  if (input.email !== undefined) updates.email = input.email;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.address !== undefined) updates.address = input.address;
  if (input.bloodGroup !== undefined) updates.bloodGroup = input.bloodGroup;
  if (input.category !== undefined) updates.category = input.category;
  if (input.religion !== undefined) updates.religion = input.religion;
  if (input.caste !== undefined) updates.caste = input.caste;
  if (input.status !== undefined) updates.status = input.status;

  await db.update(students).set(updates).where(eq(students.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "student.updated",
    entityType: "student",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

export async function deleteStudent(id: string, actorId: string) {
  const existing = await getStudent(id);
  if (!existing) {
    throw new Error("Student not found");
  }

  await db.update(students).set({ status: "inactive", archivedAt: new Date() }).where(eq(students.id, id));

  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "student.deleted",
    entityType: "student",
    entityId: id,
    before: existing,
  });

  return { success: true };
}

// Guardian operations
export interface CreateGuardianInput {
  schoolId: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  occupation?: string;
  address?: string;
  relationship: string;
  isPrimary?: boolean;
  canPay?: boolean;
  actorId: string;
}

export async function createGuardian(input: CreateGuardianInput) {
  const id = randomUUID();
  await db.insert(guardians).values({
    id,
    schoolId: input.schoolId,
    userId: input.userId ?? null,
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    occupation: input.occupation ?? null,
    address: input.address ?? null,
    relationship: input.relationship,
    isPrimary: input.isPrimary ?? false,
    canPay: input.canPay ?? true,
    status: "active",
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "guardian.created",
    entityType: "guardian",
    entityId: id,
    after: { name: input.name, phone: input.phone, relationship: input.relationship },
  });

  return { id, name: input.name, phone: input.phone, relationship: input.relationship };
}

export async function getGuardian(id: string) {
  const rows = await db.select().from(guardians).where(eq(guardians.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listGuardians(schoolId: string) {
  return db.select().from(guardians).where(eq(guardians.schoolId, schoolId)).orderBy(desc(guardians.createdAt));
}

export async function updateGuardian(id: string, input: any, actorId: string) {
  const existing = await getGuardian(id);
  if (!existing) {
    throw new Error("Guardian not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.email !== undefined) updates.email = input.email;
  if (input.occupation !== undefined) updates.occupation = input.occupation;
  if (input.address !== undefined) updates.address = input.address;
  if (input.relationship !== undefined) updates.relationship = input.relationship;
  if (input.isPrimary !== undefined) updates.isPrimary = input.isPrimary;
  if (input.canPay !== undefined) updates.canPay = input.canPay;

  await db.update(guardians).set(updates).where(eq(guardians.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "guardian.updated",
    entityType: "guardian",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Enrollment operations
export interface CreateEnrollmentInput {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
  status?: string;
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
    rollNumber: input.rollNumber,
    status: input.status ?? "active",
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "enrollment.created",
    entityType: "enrollment",
    entityId: id,
    after: {
      studentId: input.studentId,
      classId: input.classId,
      sectionId: input.sectionId,
      rollNumber: input.rollNumber,
    },
  });

  return { id, studentId: input.studentId, classId: input.classId, sectionId: input.sectionId, rollNumber: input.rollNumber };
}

export async function getEnrollment(id: string) {
  const rows = await db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listEnrollments(schoolId: string, academicYearId?: string) {
  const query = db.select().from(enrollments).where(eq(enrollments.schoolId, schoolId));
  if (academicYearId) {
    query.where(eq(enrollments.academicYearId, academicYearId));
  }
  return query.orderBy(desc(enrollments.createdAt));
}

// Student Document operations
export interface CreateStudentDocumentInput {
  schoolId: string;
  studentId: string;
  documentType: string;
  objectPath: string;
  verifiedAt?: Date;
  actorId: string;
}

export async function createStudentDocument(input: CreateStudentDocumentInput) {
  const id = randomUUID();
  await db.insert(student_documents).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    documentType: input.documentType,
    objectPath: input.objectPath,
    verifiedAt: input.verifiedAt ?? null,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "student_document.created",
    entityType: "student_document",
    entityId: id,
    after: { studentId: input.studentId, documentType: input.documentType },
  });

  return { id, studentId: input.studentId, documentType: input.documentType, verifiedAt: input.verifiedAt };
}

// Student Consent operations
export interface CreateStudentConsentInput {
  schoolId: string;
  studentId: string;
  guardianId: string;
  purpose: string;
  grantedAt: Date;
  withdrawnAt?: Date;
}

export async function createStudentConsent(input: CreateStudentConsentInput) {
  const id = randomUUID();
  await db.insert(student_consents).values({
    id,
    schoolId: input.schoolId,
    studentId: input.studentId,
    guardianId: input.guardianId,
    purpose: input.purpose,
    grantedAt: input.grantedAt,
    withdrawnAt: input.withdrawnAt ?? null,
  });

  return { id, studentId: input.studentId, guardianId: input.guardianId, purpose: input.purpose, status: "granted" };
}

export async function listStudentConsents(schoolId: string, studentId: string) {
  return db.select().from(student_consents).where(eq(student_consents.schoolId, schoolId), eq(student_consents.studentId, studentId));
}
