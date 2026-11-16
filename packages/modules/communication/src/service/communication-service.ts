import {
  db,
  notification_templates,
  template_versions,
  template_approvals,
  announcements,
  announcement_audiences,
  notifications,
  notification_deliveries,
  notification_preferences,
  opt_outs,
  provider_configs,
  message_costs,
} from "@school-erp/db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
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
  await db.insert(notification_templates).values({
    id,
    schoolId: input.schoolId,
    key: input.key,
    channel: input.channel,
    language: input.language ?? "en",
    subject: input.subject ?? null,
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
  const rows = await db.select().from(notification_templates).where(eq(notification_templates.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listNotificationTemplates(schoolId: string, channel?: string) {
  const query = db.select().from(notification_templates).where(eq(notification_templates.schoolId, schoolId));
  if (channel) {
    query.where(eq(notification_templates.channel, channel));
  }
  return query.orderBy(desc(notification_templates.createdAt));
}

export async function updateNotificationTemplate(id: string, input: any, actorId: string) {
  const existing = await getNotificationTemplate(id);
  if (!existing) {
    throw new Error("Notification template not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.subject !== undefined) updates.subject = input.subject;
  if (input.body !== undefined) updates.body = input.body;
  if (input.status !== undefined) updates.status = input.status;

  await db.update(notification_templates).set(updates).where(eq(notification_templates.id, id));
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
  variables?: any[];
  actorId: string;
}

export async function createTemplateVersion(input: CreateTemplateVersionInput) {
  const id = randomUUID();
  await db.insert(template_versions).values({
    id,
    templateId: input.templateId,
    version: input.version,
    body: input.body,
    variables: input.variables ?? null,
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
    after: { title: input.title, audience: input.audience ?? "all", status: input.status ?? "draft" },
  });

  return { id, title: input.title, audience: input.audience ?? "all", status: input.status ?? "draft" };
}

export async function getAnnouncement(id: string) {
  const rows = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listAnnouncements(schoolId: string, status?: string) {
  const query = db.select().from(announcements).where(eq(announcements.schoolId, schoolId));
  if (status) {
    query.where(eq(announcements.status, status));
  }
  return query.orderBy(desc(announcements.createdAt));
}

export async function updateAnnouncement(id: string, input: any, actorId: string) {
  const existing = await getAnnouncement(id);
  if (!existing) {
    throw new Error("Announcement not found");
  }

  const updates: any = { updatedAt: new Date() };
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
    after: { recipientId: input.recipientId, channel: input.channel, status: input.status ?? "pending" },
  });

  return { id, recipientId: input.recipientId, channel: input.channel, status: input.status ?? "pending" };
}

export async function getNotification(id: string) {
  const rows = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listNotifications(schoolId: string, recipientId?: string, status?: string) {
  const query = db.select().from(notifications).where(eq(notifications.schoolId, schoolId));
  if (recipientId) {
    query.where(eq(notifications.recipientId, recipientId));
  }
  if (status) {
    query.where(eq(notifications.status, status));
  }
  return query.orderBy(desc(notifications.createdAt));
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

  await db.insert(notification_deliveries).values({
    id,
    notificationId: input.notificationId,
    provider: input.provider,
    providerMessageId: input.providerMessageId ?? null,
    status: input.status ?? "pending",
    attempt: input.attempt ?? 1,
    error: input.error ?? null,
    deliveredAt: input.deliveredAt ?? null,
  });

  return { id, notificationId: input.notificationId, provider: input.provider, status: input.status ?? "pending" };
}

export async function getNotificationDelivery(id: string) {
  const rows = await db.select().from(notification_deliveries).where(eq(notification_deliveries.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listNotificationDeliveries(schoolId: string, notificationId?: string) {
  const query = db.select().from(notification_deliveries).where(eq(notification_deliveries.schoolId, schoolId));
  if (notificationId) {
    query.where(eq(notification_deliveries.notificationId, notificationId));
  }
  return query.orderBy(desc(notification_deliveries.createdAt));
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

  await db.insert(notification_preferences).values({
    id,
    schoolId: input.schoolId,
    guardianId: input.guardianId,
    channel: input.channel,
    category: input.category,
    status: input.status ?? "subscribed",
  });

  return { id, guardianId: input.guardianId, channel: input.channel, category: input.category, status: input.status ?? "subscribed" };
}

export async function getNotificationPreference(schoolId: string, guardianId: string, channel: string, category: string) {
  const rows = await db
    .select()
    .from(notification_preferences)
    .where(eq(notification_preferences.schoolId, schoolId), eq(notification_preferences.guardianId, guardianId), eq(notification_preferences.channel, channel), eq(notification_preferences.category, category))
    .limit(1);
  return rows[0] ?? null;
}

export async function listNotificationPreferences(schoolId: string, guardianId?: string) {
  const query = db.select().from(notification_preferences).where(eq(notification_preferences.schoolId, schoolId));
  if (guardianId) {
    query.where(eq(notification_preferences.guardianId, guardianId));
  }
  return query.orderBy(notification_preferences.category);
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

  await db.insert(opt_outs).values({
    id,
    schoolId: input.schoolId,
    recipientId: input.recipientId,
    channel: input.channel,
    reason: input.reason ?? null,
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

export async function listOptOuts(schoolId: string, recipientId?: string) {
  const query = db.select().from(opt_outs).where(eq(opt_outs.schoolId, schoolId));
  if (recipientId) {
    query.where(eq(opt_outs.recipientId, recipientId));
  }
  return query.orderBy(desc(opt_outs.createdAt));
}

// Provider Config operations
export interface CreateProviderConfigInput {
  schoolId?: string;
  provider: string;
  config: any;
  actorId: string;
}

export async function createProviderConfig(input: CreateProviderConfigInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(provider_configs).values({
    id,
    schoolId: input.schoolId ?? null,
    provider: input.provider,
    config: input.config,
  });

  return { id, provider: input.provider };
}

export async function getProviderConfig(schoolId: string, provider: string) {
  const rows = await db
    .select()
    .from(provider_configs)
    .where(eq(provider_configs.schoolId, schoolId), eq(provider_configs.provider, provider))
    .limit(1);
  return rows[0] ?? null;
}

export async function listProviderConfigs(schoolId: string) {
  return db.select().from(provider_configs).where(eq(provider_configs.schoolId, schoolId));
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

  await db.insert(message_costs).values({
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
    .from(message_costs)
    .where(eq(message_costs.schoolId, schoolId), eq(message_costs.channel, channel), eq(message_costs.period, period))
    .limit(1);
  return rows[0] ?? null;
}

export async function listMessageCosts(schoolId: string, channel?: string, period?: string) {
  const query = db.select().from(message_costs).where(eq(message_costs.schoolId, schoolId));
  if (channel) {
    query.where(eq(message_costs.channel, channel));
  }
  if (period) {
    query.where(eq(message_costs.period, period));
  }
  return query.orderBy(desc(message_costs.period), desc(message_costs.createdAt));
}
