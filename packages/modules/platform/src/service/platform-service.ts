import { db, organizations, schools, invitations } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

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

export async function listSchools() {
  return db.select().from(schools);
}

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
  return { id, email: input.email, expiresAt };
}
