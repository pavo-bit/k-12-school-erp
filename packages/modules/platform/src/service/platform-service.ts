import { db, organizations, schools, academic_years, invitations, school_settings } from "@school-erp/db";
import { eq, and, desc } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Organization operations
export interface CreateOrganizationInput {
  name: string;
  billingEmail?: string | undefined;
  actorId: string;
}

export async function createOrganization(input: CreateOrganizationInput) {
  const id = randomUUID();
  await db.insert(organizations).values({
    id,
    name: input.name,
    billingEmail: input.billingEmail ?? null,
    status: "active",
  });
  await writeAudit({
    scope: "platform",
    schoolId: null,
    actorId: input.actorId,
    action: "organization.created",
    entityType: "organization",
    entityId: id,
    after: { name: input.name, billingEmail: input.billingEmail ?? null },
  });
  return { id, name: input.name };
}

export async function getOrganization(id: string) {
  const rows = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listOrganizations() {
  return db.select().from(organizations);
}

export async function updateOrganization(id: string, input: { name?: string; billingEmail?: string; status?: string }, actorId: string) {
  const existing = await getOrganization(id);
  if (!existing) {
    throw new Error("Organization not found");
  }

  const updates: any = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.billingEmail !== undefined) updates.billingEmail = input.billingEmail;
  if (input.status !== undefined) updates.status = input.status;
  updates.updatedAt = new Date();

  await db.update(organizations).set(updates).where(eq(organizations.id, id));
  await writeAudit({
    scope: "platform",
    schoolId: null,
    actorId,
    action: "organization.updated",
    entityType: "organization",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// School operations
export interface CreateSchoolInput {
  organizationId: string;
  name: string;
  slug: string;
  board?: string | undefined;
  timezone: string;
  locale: string;
  actorId: string;
}

export async function createSchool(input: CreateSchoolInput) {
  const id = randomUUID();
  await db.insert(schools).values({
    id,
    organizationId: input.organizationId,
    name: input.name,
    slug: input.slug,
    board: input.board ?? null,
    timezone: input.timezone,
    locale: input.locale,
    status: "active",
  });
  await writeAudit({
    scope: "platform",
    schoolId: id,
    actorId: input.actorId,
    action: "school.created",
    entityType: "school",
    entityId: id,
    after: { name: input.name, slug: input.slug, organizationId: input.organizationId },
  });
  return { id, name: input.name, slug: input.slug };
}

export async function getSchool(id: string) {
  const rows = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listSchools(organizationId?: string) {
  const query = db.select().from(schools);
  if (organizationId) {
    return query.where(eq(schools.organizationId, organizationId));
  }
  return query;
}

export async function getSchoolBySlug(slug: string) {
  const rows = await db.select().from(schools).where(eq(schools.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function updateSchool(id: string, input: any, actorId: string) {
  const existing = await getSchool(id);
  if (!existing) {
    throw new Error("School not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.board !== undefined) updates.board = input.board;
  if (input.timezone !== undefined) updates.timezone = input.timezone;
  if (input.locale !== undefined) updates.locale = input.locale;
  if (input.status !== undefined) updates.status = input.status;

  await db.update(schools).set(updates).where(eq(schools.id, id));
  await writeAudit({
    scope: "platform",
    schoolId: id,
    actorId,
    action: "school.updated",
    entityType: "school",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Academic Year operations
export interface CreateAcademicYearInput {
  schoolId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status?: string;
  actorId: string;
}

export async function createAcademicYear(input: CreateAcademicYearInput) {
  const id = randomUUID();
  const status = input.status ?? "draft";

  await db.insert(academic_years).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    status,
  });

  await writeAudit({
    scope: "platform",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "academic_year.created",
    entityType: "academic_year",
    entityId: id,
    after: { name: input.name, startDate: input.startDate, endDate: input.endDate, status },
  });

  return { id, name: input.name, startDate: input.startDate, endDate: input.endDate, status };
}

export async function getAcademicYear(id: string) {
  const rows = await db.select().from(academic_years).where(eq(academic_years.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getActiveAcademicYear(schoolId: string) {
  const rows = await db
    .select()
    .from(academic_years)
    .where(eq(academic_years.schoolId, schoolId))
    .orderBy(desc(academic_years.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listAcademicYears(schoolId: string) {
  return db.select().from(academic_years).where(eq(academic_years.schoolId, schoolId)).orderBy(desc(academic_years.createdAt));
}

export async function updateAcademicYear(id: string, input: any, actorId: string) {
  const existing = await getAcademicYear(id);
  if (!existing) {
    throw new Error("Academic year not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.startDate !== undefined) updates.startDate = input.startDate;
  if (input.endDate !== undefined) updates.endDate = input.endDate;
  if (input.status !== undefined) updates.status = input.status;

  await db.update(academic_years).set(updates).where(eq(academic_years.id, id));
  await writeAudit({
    scope: "platform",
    schoolId: existing.schoolId,
    actorId,
    action: "academic_year.updated",
    entityType: "academic_year",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Invitation operations
export interface InviteStaffInput {
  schoolId: string;
  email: string;
  roleId: string;
  actorId: string;
}

export async function inviteStaff(input: InviteStaffInput) {
  const id = randomUUID();
  const tokenHash = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await db.insert(invitations).values({
    id,
    schoolId: input.schoolId,
    email: input.email,
    roleId: input.roleId,
    tokenHash,
    expiresAt,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "invitation.created",
    entityType: "invitation",
    entityId: id,
    after: { email: input.email, roleId: input.roleId },
  });

  return { id, email: input.email, roleId: input.roleId, expiresAt };
}

export async function listInvitations(schoolId: string) {
  return db.select().from(invitations).where(eq(invitations.schoolId, schoolId)).orderBy(desc(invitations.createdAt));
}

export async function acceptInvitation(token: string, actorId: string) {
  // Find invitation by token hash
  const rows = await db.select().from(invitations).where(eq(invitations.tokenHash, token)).limit(1);
  const invitation = rows[0];

  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("Invitation has expired");
  }

  if (invitation.status === "accepted") {
    throw new Error("Invitation already accepted");
  }

  // Here you would integrate with Better Auth to create the user account
  // This is a placeholder for the actual implementation
  await db.update(invitations).set({ status: "accepted", acceptedAt: new Date() }).where(eq(invitations.id, invitation.id));

  await writeAudit({
    scope: "school",
    schoolId: invitation.schoolId,
    actorId,
    action: "invitation.accepted",
    entityType: "invitation",
    entityId: invitation.id,
    after: { status: "accepted" },
  });

  return { id: invitation.id, email: invitation.email, roleId: invitation.roleId, acceptedAt: new Date() };
}

// School Settings operations
export async function getSchoolSetting(schoolId: string, key: string) {
  const rows = await db.select().from(school_settings).where(eq(school_settings.schoolId, schoolId), eq(school_settings.key, key)).limit(1);
  return rows[0] ?? null;
}

export async function setSchoolSetting(schoolId: string, key: string, value: any, actorId: string) {
  const existing = await getSchoolSetting(schoolId, key);

  if (existing) {
    await db.update(school_settings).set({ value, updatedAt: new Date() }).where(eq(school_settings.id, existing.id));
    await writeAudit({
      scope: "school",
      schoolId,
      actorId,
      action: "school_setting.updated",
      entityType: "school_setting",
      entityId: existing.id,
      before: existing,
      after: { value },
    });
  } else {
    const id = randomUUID();
    await db.insert(school_settings).values({ id, schoolId, key, value });
    await writeAudit({
      scope: "school",
      schoolId,
      actorId,
      action: "school_setting.created",
      entityType: "school_setting",
      entityId: id,
      after: { key, value },
    });
  }

  return { schoolId, key, value };
}

export async function listSchoolSettings(schoolId: string) {
  return db.select().from(school_settings).where(eq(school_settings.schoolId, schoolId));
}

export async function deleteSchoolSetting(schoolId: string, key: string, actorId: string) {
  const existing = await getSchoolSetting(schoolId, key);
  if (!existing) {
    throw new Error("Setting not found");
  }

  await db.delete(school_settings).where(eq(school_settings.id, existing.id));
  await writeAudit({
    scope: "school",
    schoolId,
    actorId,
    action: "school_setting.deleted",
    entityType: "school_setting",
    entityId: existing.id,
    before: existing,
  });

  return { success: true };
}
