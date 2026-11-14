import { db, announcements, notificationTemplates, notificationDeliveries } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

export interface CreateAnnouncementInput {
  schoolId: string;
  title: string;
  body: string;
  audience: string;
  actorId: string;
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const id = randomUUID();
  await db.insert(announcements).values({
    id,
    schoolId: input.schoolId,
    title: input.title,
    body: input.body,
    audience: input.audience,
    status: "draft",
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "announcement.created",
    entityType: "announcement",
    entityId: id,
    after: { title: input.title, audience: input.audience },
  });
  return { id, title: input.title, status: "draft" };
}

export async function listAnnouncements(schoolId: string) {
  return db.select().from(announcements).where(eq(announcements.schoolId, schoolId));
}

export async function sendAnnouncement(schoolId: string, announcementId: string, actorId: string) {
  await db
    .update(announcements)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(announcements.id, announcementId));
  await writeAudit({
    scope: "school",
    schoolId,
    actorId,
    action: "announcement.sent",
    entityType: "announcement",
    entityId: announcementId,
  });
  return { id: announcementId, status: "sent" };
}

export interface CreateTemplateInput {
  schoolId: string;
  key: string;
  channel: string;
  language: string;
  body: string;
  actorId: string;
}

export async function createTemplate(input: CreateTemplateInput) {
  const id = randomUUID();
  await db.insert(notificationTemplates).values({
    id,
    schoolId: input.schoolId,
    key: input.key,
    channel: input.channel,
    language: input.language,
    body: input.body,
    status: "draft",
  });
  return { id, key: input.key, channel: input.channel };
}

export async function listTemplates(schoolId: string) {
  return db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.schoolId, schoolId));
}
