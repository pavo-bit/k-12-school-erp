import { db, enquiries, applications, application_documents, application_notes, conversions, admission_status_history } from "@school-erp/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Enquiry operations
export interface CreateEnquiryInput {
  schoolId: string;
  studentName: string;
  guardianPhone: string;
  classSought: string;
  source?: string;
  status?: string;
  notes?: string;
  actorId: string;
}

export async function createEnquiry(input: CreateEnquiryInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(enquiries).values({
    id,
    schoolId: input.schoolId,
    studentName: input.studentName,
    guardianPhone: input.guardianPhone,
    classSought: input.classSought,
    source: input.source ?? "other",
    status: input.status ?? "new",
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "enquiry.created",
    entityType: "enquiry",
    entityId: id,
    after: { studentName: input.studentName, guardianPhone: input.guardianPhone, classSought: input.classSought },
  });

  return { id, studentName: input.studentName, guardianPhone: input.guardianPhone, classSought: input.classSought };
}

export async function getEnquiry(id: string) {
  const rows = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listEnquiries(schoolId: string, status?: string, classSought?: string) {
  const query = db.select().from(enquiries).where(eq(enquiries.schoolId, schoolId));
  if (status) {
    query.where(eq(enquiries.status, status));
  }
  if (classSought) {
    query.where(eq(enquiries.classSought, classSought));
  }
  return query.orderBy(desc(enquiries.createdAt));
}

export async function updateEnquiry(id: string, input: any, actorId: string) {
  const existing = await getEnquiry(id);
  if (!existing) {
    throw new Error("Enquiry not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.studentName !== undefined) updates.studentName = input.studentName;
  if (input.guardianPhone !== undefined) updates.guardianPhone = input.guardianPhone;
  if (input.classSought !== undefined) updates.classSought = input.classSought;
  if (input.status !== undefined) updates.status = input.status;
  if (input.notes !== undefined) updates.notes = input.notes;

  await db.update(enquiries).set(updates).where(eq(enquiries.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "enquiry.updated",
    entityType: "enquiry",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Application operations
export interface CreateApplicationInput {
  schoolId: string;
  enquiryId: string;
  academicYearId: string;
  status?: string;
  notes?: string;
  actorId: string;
}

export async function createApplication(input: CreateApplicationInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(applications).values({
    id,
    schoolId: input.schoolId,
    enquiryId: input.enquiryId,
    academicYearId: input.academicYearId,
    status: input.status ?? "draft",
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  // Add status history
  await db.insert(admission_status_history).values({
    id: randomUUID(),
    schoolId: input.schoolId,
    applicationId: id,
    status: input.status ?? "draft",
    actorId: input.actorId,
    notes: input.notes ?? null,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "application.created",
    entityType: "application",
    entityId: id,
    after: { enquiryId: input.enquiryId, academicYearId: input.academicYearId, status: input.status ?? "draft" },
  });

  return { id, enquiryId: input.enquiryId, academicYearId: input.academicYearId, status: input.status ?? "draft" };
}

export async function getApplication(id: string) {
  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listApplications(schoolId: string, academicYearId?: string, status?: string) {
  const query = db.select().from(applications).where(eq(applications.schoolId, schoolId));
  if (academicYearId) {
    query.where(eq(applications.academicYearId, academicYearId));
  }
  if (status) {
    query.where(eq(applications.status, status));
  }
  return query.orderBy(desc(applications.createdAt));
}

export async function updateApplication(id: string, input: any, actorId: string) {
  const existing = await getApplication(id);
  if (!existing) {
    throw new Error("Application not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.status !== undefined) updates.status = input.status;
  if (input.notes !== undefined) updates.notes = input.notes;

  await db.update(applications).set(updates).where(eq(applications.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "application.updated",
    entityType: "application",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Application Document operations
export interface CreateApplicationDocumentInput {
  schoolId: string;
  applicationId: string;
  documentType: string;
  objectPath: string;
  verifiedAt?: Date;
  actorId: string;
}

export async function createApplicationDocument(input: CreateApplicationDocumentInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(application_documents).values({
    id,
    schoolId: input.schoolId,
    applicationId: input.applicationId,
    documentType: input.documentType,
    objectPath: input.objectPath,
    verifiedAt: input.verifiedAt ?? null,
    createdAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "application_document.created",
    entityType: "application_document",
    entityId: id,
    after: { applicationId: input.applicationId, documentType: input.documentType },
  });

  return { id, applicationId: input.applicationId, documentType: input.documentType };
}

// Application Note operations
export interface CreateApplicationNoteInput {
  schoolId: string;
  applicationId: string;
  note: string;
  actorId: string;
}

export async function createApplicationNote(input: CreateApplicationNoteInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(application_notes).values({
    id,
    schoolId: input.schoolId,
    applicationId: input.applicationId,
    note: input.note,
    actorId: input.actorId,
    createdAt: now,
    updatedAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "application_note.created",
    entityType: "application_note",
    entityId: id,
    after: { applicationId: input.applicationId, note: input.note },
  });

  return { id, applicationId: input.applicationId, note: input.note };
}

// Conversion operations
export interface CreateConversionInput {
  schoolId: string;
  applicationId: string;
  convertedStudentId: string;
  convertedAt: Date;
  actorId: string;
}

export async function createConversion(input: CreateConversionInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(conversions).values({
    id,
    schoolId: input.schoolId,
    applicationId: input.applicationId,
    convertedStudentId: input.convertedStudentId,
    convertedAt: input.convertedAt,
    createdAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "conversion.created",
    entityType: "conversion",
    entityId: id,
    after: { applicationId: input.applicationId, convertedStudentId: input.convertedStudentId },
  });

  return { id, applicationId: input.applicationId, convertedStudentId: input.convertedStudentId };
}

// Admission Status History operations
export interface CreateAdmissionStatusHistoryInput {
  schoolId: string;
  applicationId: string;
  status: string;
  actorId: string;
  notes?: string;
}

export async function createAdmissionStatusHistory(input: CreateAdmissionStatusHistoryInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(admission_status_history).values({
    id,
    schoolId: input.schoolId,
    applicationId: input.applicationId,
    status: input.status,
    actorId: input.actorId,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "admission_status_history.created",
    entityType: "admission_status_history",
    entityId: id,
    after: { applicationId: input.applicationId, status: input.status },
  });

  return { id, applicationId: input.applicationId, status: input.status };
}

export async function listAdmissionStatusHistory(schoolId: string, applicationId: string) {
  return db
    .select()
    .from(admission_status_history)
    .where(eq(admission_status_history.schoolId, schoolId), eq(admission_status_history.applicationId, applicationId))
    .orderBy(desc(admission_status_history.createdAt));
}

// Conversion operations
export async function listConversions(schoolId: string, applicationId?: string) {
  const query = db.select().from(conversions).where(eq(conversions.schoolId, schoolId));
  if (applicationId) {
    query.where(eq(conversions.applicationId, applicationId));
  }
  return query.orderBy(desc(conversions.createdAt));
}

// Statistics operations
export async function getEnquiryStats(schoolId: string) {
  const total = await db.select().from(enquiries).where(eq(enquiries.schoolId, schoolId));
  const newEnquiries = total.filter((e) => e.status === "new").length;
  const contacted = total.filter((e) => e.status === "contacted").length;
  const scheduled = total.filter((e) => e.status === "scheduled").length;
  const converted = total.filter((e) => e.status === "converted").length;
  const rejected = total.filter((e) => e.status === "rejected").length;

  return {
    total: total.length,
    new: newEnquiries,
    contacted,
    scheduled,
    converted,
    rejected,
  };
}

export async function getApplicationStats(schoolId: string, academicYearId?: string) {
  const query = db.select().from(applications).where(eq(applications.schoolId, schoolId));
  if (academicYearId) {
    query.where(eq(applications.academicYearId, academicYearId));
  }
  const total = await query;

  const statusCounts = total.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: total.length,
    statusCounts,
  };
}
