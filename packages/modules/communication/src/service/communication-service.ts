import {
  db,
  notificationTemplates,
  templateVersions,
  templateApprovals,
  announcements,
  announcementAudiences,
  notifications,
  notificationDeliveries,
  notificationPreferences,
  optOuts,
  providerConfigs,
  messageCosts,
} from "@school-erp/db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { sendConsolePush } from "./console-driver";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Notification Template operations
export interface CreateNotificationTemplateInput {
  schoolId: string;
  key: string;
  channel: string;
  language?: string;
  subject?: string;
  body: string;
  status?: string;
  actorId: string;
}

export async function createNotificationTemplate(input: CreateNotificationTemplateInput) {
  const id = randomUUID();
  await db.insert(notificationTemplates).values({
    id,
    schoolId: input.schoolId,
    key: input.key,
    channel: input.channel,
    language: input.language ?? "en",
    body: input.body,
    status: input.status ?? "draft",
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "notification_template.created",
    entityType: "notification_template",
    entityId: id,
    after: { key: input.key, channel: input.channel, language: input.language ?? "en" },
  });

  return { id, key: input.key, channel: input.channel, language: input.language ?? "en" };
}

export async function getNotificationTemplate(id: string) {
  const rows = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listNotificationTemplates(schoolId: string, channel?: string) {
  const conditions = [eq(notificationTemplates.schoolId, schoolId)];
  if (channel) conditions.push(eq(notificationTemplates.channel, channel));
  return db
    .select()
    .from(notificationTemplates)
    .where(and(...conditions))
    .orderBy(desc(notificationTemplates.createdAt));
}

export async function updateNotificationTemplate(
  id: string,
  input: Record<string, unknown>,
  actorId: string,
) {
  const existing = await getNotificationTemplate(id);
  if (!existing) {
    throw new Error("Notification template not found");
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  // subject not stored in notification_templates schema
  if (input.body !== undefined) updates.body = input.body;
  if (input.status !== undefined) updates.status = input.status;

  await db.update(notificationTemplates).set(updates).where(eq(notificationTemplates.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "notification_template.updated",
    entityType: "notification_template",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Template Version operations
export interface CreateTemplateVersionInput {
  templateId: string;
  version: number;
  body: string;
  variables?: unknown[];
  actorId: string;
}

export async function createTemplateVersion(input: CreateTemplateVersionInput) {
  const id = randomUUID();
  await db.insert(templateVersions).values({
    id,
    templateId: input.templateId,
    version: input.version,
    body: input.body,
    variables: input.variables ? JSON.stringify(input.variables) : null,
  });

  return { id, templateId: input.templateId, version: input.version };
}

// Announcement operations
export interface CreateAnnouncementInput {
  schoolId: string;
  title: string;
  body: string;
  audience?: string;
  status?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  actorId: string;
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(announcements).values({
    id,
    schoolId: input.schoolId,
    title: input.title,
    body: input.body,
    audience: input.audience ?? "all",
    status: input.status ?? "draft",
    scheduledAt: input.scheduledAt ?? null,
    sentAt: input.sentAt ?? null,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "announcement.created",
    entityType: "announcement",
    entityId: id,
    after: {
      title: input.title,
      audience: input.audience ?? "all",
      status: input.status ?? "draft",
    },
  });

  return {
    id,
    title: input.title,
    audience: input.audience ?? "all",
    status: input.status ?? "draft",
  };
}

export async function getAnnouncement(id: string) {
  const rows = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listAnnouncements(schoolId: string, status?: string) {
  const conditions = [eq(announcements.schoolId, schoolId)];
  if (status) conditions.push(eq(announcements.status, status));
  return db
    .select()
    .from(announcements)
    .where(and(...conditions))
    .orderBy(desc(announcements.createdAt));
}

export async function updateAnnouncement(
  id: string,
  input: Record<string, unknown>,
  actorId: string,
) {
  const existing = await getAnnouncement(id);
  if (!existing) {
    throw new Error("Announcement not found");
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.body !== undefined) updates.body = input.body;
  if (input.status !== undefined) updates.status = input.status;
  if (input.scheduledAt !== undefined) updates.scheduledAt = input.scheduledAt;
  if (input.sentAt !== undefined) updates.sentAt = input.sentAt;

  await db.update(announcements).set(updates).where(eq(announcements.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "announcement.updated",
    entityType: "announcement",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Notification operations
export interface CreateNotificationInput {
  schoolId: string;
  eventKey: string;
  recipientId: string;
  channel: string;
  status?: string;
  actorId: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(notifications).values({
    id,
    schoolId: input.schoolId,
    eventKey: input.eventKey,
    recipientId: input.recipientId,
    channel: input.channel,
    status: input.status ?? "pending",
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "notification.created",
    entityType: "notification",
    entityId: id,
    after: {
      recipientId: input.recipientId,
      channel: input.channel,
      status: input.status ?? "pending",
    },
  });

  return {
    id,
    recipientId: input.recipientId,
    channel: input.channel,
    status: input.status ?? "pending",
  };
}

export async function getNotification(id: string) {
  const rows = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listNotifications(schoolId: string, recipientId?: string, status?: string) {
  const conditions = [eq(notifications.schoolId, schoolId)];
  if (recipientId) conditions.push(eq(notifications.recipientId, recipientId));
  if (status) conditions.push(eq(notifications.status, status));
  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));
}

// Notification Delivery operations
export interface CreateNotificationDeliveryInput {
  notificationId: string;
  provider: string;
  providerMessageId?: string;
  status?: string;
  attempt?: number;
  error?: string;
  deliveredAt?: Date;
  actorId: string;
}

export async function createNotificationDelivery(input: CreateNotificationDeliveryInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(notificationDeliveries).values({
    id,
    notificationId: input.notificationId,
    provider: input.provider,
    providerMessageId: input.providerMessageId ?? null,
    status: input.status ?? "pending",
    attempt: input.attempt ?? 1,
    error: input.error ?? null,
  });

  return {
    id,
    notificationId: input.notificationId,
    provider: input.provider,
    status: input.status ?? "pending",
  };
}

export async function getNotificationDelivery(id: string) {
  const rows = await db
    .select()
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listNotificationDeliveries(_schoolId: string, notificationId?: string) {
  if (notificationId) {
    return db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, notificationId))
      .orderBy(desc(notificationDeliveries.createdAt));
  }
  return db.select().from(notificationDeliveries).orderBy(desc(notificationDeliveries.createdAt));
}

// Notification Preference operations
export interface CreateNotificationPreferenceInput {
  schoolId: string;
  guardianId: string;
  channel: string;
  category: string;
  status?: string;
  actorId: string;
}

export async function createNotificationPreference(input: CreateNotificationPreferenceInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(notificationPreferences).values({
    id,
    userId: input.guardianId,
    channel: input.channel,
    category: input.category,
    status: input.status ?? "subscribed",
  });

  return {
    id,
    guardianId: input.guardianId,
    channel: input.channel,
    category: input.category,
    status: input.status ?? "subscribed",
  };
}

export async function getNotificationPreference(
  _schoolId: string,
  guardianId: string,
  channel: string,
  category: string,
) {
  const rows = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, guardianId),
        eq(notificationPreferences.channel, channel),
        eq(notificationPreferences.category, category),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listNotificationPreferences(_schoolId: string, guardianId?: string) {
  const conditions = [];
  if (guardianId) conditions.push(eq(notificationPreferences.userId, guardianId));
  if (conditions.length > 0) {
    return db
      .select()
      .from(notificationPreferences)
      .where(and(...conditions))
      .orderBy(notificationPreferences.category);
  }
  return db.select().from(notificationPreferences).orderBy(notificationPreferences.category);
}

// Opt-out operations
export interface CreateOptOutInput {
  schoolId: string;
  recipientId: string;
  channel: string;
  reason?: string;
  actorId: string;
}

export async function createOptOut(input: CreateOptOutInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(optOuts).values({
    id,
    userId: input.recipientId,
    channel: input.channel,
    category: input.reason ?? "all",
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "opt_out.created",
    entityType: "opt_out",
    entityId: id,
    after: { recipientId: input.recipientId, channel: input.channel },
  });

  return { id, recipientId: input.recipientId, channel: input.channel };
}

export async function listOptOuts(_schoolId: string, recipientId?: string) {
  const conditions = [];
  if (recipientId) conditions.push(eq(optOuts.userId, recipientId));
  if (conditions.length > 0) {
    return db
      .select()
      .from(optOuts)
      .where(and(...conditions))
      .orderBy(desc(optOuts.createdAt));
  }
  return db.select().from(optOuts).orderBy(desc(optOuts.createdAt));
}

// Provider Config operations
export interface CreateProviderConfigInput {
  schoolId?: string;
  provider: string;
  config: string;
  actorId: string;
}

export async function createProviderConfig(input: CreateProviderConfigInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(providerConfigs).values({
    id,
    schoolId: input.schoolId ?? null,
    provider: input.provider,
    config: JSON.stringify(input.config),
  });

  return { id, provider: input.provider };
}

export async function getProviderConfig(schoolId: string, provider: string) {
  const rows = await db
    .select()
    .from(providerConfigs)
    .where(and(eq(providerConfigs.schoolId, schoolId), eq(providerConfigs.provider, provider)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listProviderConfigs(schoolId: string) {
  return db.select().from(providerConfigs).where(eq(providerConfigs.schoolId, schoolId));
}

// Message Cost operations
export interface CreateMessageCostInput {
  schoolId: string;
  channel: string;
  units: number;
  costPaise: number;
  period: string;
  actorId: string;
}

export async function createMessageCost(input: CreateMessageCostInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(messageCosts).values({
    id,
    schoolId: input.schoolId,
    channel: input.channel,
    units: input.units,
    costPaise: input.costPaise,
    period: input.period,
  });

  return { id, channel: input.channel, costPaise: input.costPaise, period: input.period };
}

export async function getMessageCost(schoolId: string, channel: string, period: string) {
  const rows = await db
    .select()
    .from(messageCosts)
    .where(
      and(
        eq(messageCosts.schoolId, schoolId),
        eq(messageCosts.channel, channel),
        eq(messageCosts.period, period),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listMessageCosts(schoolId: string, channel?: string, period?: string) {
  const conditions = [eq(messageCosts.schoolId, schoolId)];
  if (channel) conditions.push(eq(messageCosts.channel, channel));
  if (period) conditions.push(eq(messageCosts.period, period));
  return db
    .select()
    .from(messageCosts)
    .where(and(...conditions))
    .orderBy(desc(messageCosts.period), desc(messageCosts.createdAt));
}

// Announcement send operations
export async function sendAnnouncement(schoolId: string, announcementId: string, actorId: string) {
  const announcement = await getAnnouncement(announcementId);
  if (!announcement) {
    throw new Error("Announcement not found");
  }

  // Deliver via console driver (local dev; production uses provider adapters)
  sendConsolePush("all:" + schoolId, announcement.title, announcement.body);

  // Record a broadcast notification
  const id = randomUUID();
  await db.insert(notifications).values({
    id,
    schoolId,
    eventKey: "announcement.sent",
    recipientId: actorId,
    channel: "push",
    status: "delivered",
  });

  // Mark announcement as sent
  await db
    .update(announcements)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(announcements.id, announcementId));

  await writeAudit({
    scope: "school",
    schoolId,
    actorId,
    action: "announcement.sent",
    entityType: "announcement",
    entityId: announcementId,
    after: { title: announcement.title },
  });

  return { id: announcementId, status: "sent" };
}
