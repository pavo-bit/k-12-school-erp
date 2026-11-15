import { db, enquiries, applications } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

export interface CreateEnquiryInput {
  schoolId: string;
  studentName: string;
  guardianPhone: string;
  classSought: string;
  source: string;
  actorId: string;
}

export async function createEnquiry(input: CreateEnquiryInput) {
  const id = randomUUID();
  await db.insert(enquiries).values({
    id,
    schoolId: input.schoolId,
    studentName: input.studentName,
    guardianPhone: input.guardianPhone,
    classSought: input.classSought,
    source: input.source,
    status: "new",
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "enquiry.created",
    entityType: "enquiry",
    entityId: id,
    after: { studentName: input.studentName },
  });
  return { id, studentName: input.studentName, status: "new" };
}

export async function listEnquiries(schoolId: string, status?: string) {
  if (status) {
    return db
      .select()
      .from(enquiries)
      .where(and(eq(enquiries.schoolId, schoolId), eq(enquiries.status, status)));
  }
  return db.select().from(enquiries).where(eq(enquiries.schoolId, schoolId));
}

export interface CreateApplicationInput {
  schoolId: string;
  enquiryId?: string;
  academicYearId: string;
  studentName: string;
  actorId: string;
}

export async function createApplication(input: CreateApplicationInput) {
  const id = randomUUID();
  await db.insert(applications).values({
    id,
    schoolId: input.schoolId,
    enquiryId: input.enquiryId ?? null,
    academicYearId: input.academicYearId,
    status: "submitted",
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "application.created",
    entityType: "application",
    entityId: id,
  });
  return { id, status: "submitted" };
}

export async function listApplications(schoolId: string, status?: string) {
  if (status) {
    return db
      .select()
      .from(applications)
      .where(and(eq(applications.schoolId, schoolId), eq(applications.status, status)));
  }
  return db.select().from(applications).where(eq(applications.schoolId, schoolId));
}

export async function updateApplicationStatus(
  schoolId: string,
  applicationId: string,
  status: string,
  actorId: string,
) {
  await db.update(applications).set({ status }).where(eq(applications.id, applicationId));
  await writeAudit({
    scope: "school",
    schoolId,
    actorId,
    action: "application.status_changed",
    entityType: "application",
    entityId: applicationId,
    after: { status },
  });
  return { id: applicationId, status };
}
