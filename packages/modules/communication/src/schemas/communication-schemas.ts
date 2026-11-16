import { z } from "zod";

// Notification Template schemas
export const CreateNotificationTemplateSchema = z.object({
  schoolId: z.string().uuid(),
  key: z.string().min(1).max(100),
  channel: z.enum(["email", "sms", "whatsapp", "push"]),
  language: z.enum(["en", "hi", "mr"]).default("en"),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000),
  status: z.enum(["draft", "active", "approved"]).default("draft"),
  actorId: z.string(),
});

export const UpdateNotificationTemplateSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000).optional(),
  status: z.enum(["draft", "active", "approved"]).optional(),
});

export const NotificationTemplateResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  key: z.string(),
  channel: z.string(),
  language: z.string(),
  subject: z.string().nullable(),
  body: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Template Version schemas
export const CreateTemplateVersionSchema = z.object({
  templateId: z.string().uuid(),
  version: z.number().int().min(1),
  body: z.string().min(1).max(5000),
  variables: z.array(z.object({ name: z.string(), type: z.string() })).optional(),
  actorId: z.string(),
});

export const TemplateVersionResponseSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  version: z.number(),
  body: z.string(),
  variables: z.array(z.any()).nullable(),
  createdAt: z.date(),
});

// Announcement schemas
export const CreateAnnouncementSchema = z.object({
  schoolId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  audience: z.enum(["all", "staff", "parents", "students"]).default("all"),
  status: z.enum(["draft", "scheduled", "sent", "cancelled"]).default("draft"),
  scheduledAt: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),
  actorId: z.string(),
});

export const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(10000).optional(),
  status: z.enum(["draft", "scheduled", "sent", "cancelled"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),
});

export const AnnouncementResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  audience: z.string(),
  status: z.string(),
  scheduledAt: z.date().nullable(),
  sentAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Notification schemas
export const CreateNotificationSchema = z.object({
  schoolId: z.string().uuid(),
  eventKey: z.string().min(1).max(100),
  recipientId: z.string().uuid(),
  channel: z.enum(["email", "sms", "whatsapp", "push"]),
  status: z.enum(["pending", "sent", "failed"]).default("pending"),
  actorId: z.string(),
});

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  eventKey: z.string(),
  recipientId: z.string().uuid(),
  channel: z.string(),
  status: z.string(),
  createdAt: z.date(),
});

// Notification Delivery schemas
export const CreateNotificationDeliverySchema = z.object({
  notificationId: z.string().uuid(),
  provider: z.enum(["resend", "msg91", "whatsapp_bsp", "firebase"]),
  providerMessageId: z.string().optional(),
  status: z.enum(["pending", "sent", "failed", "delivered", "undelivered"]).default("pending"),
  attempt: z.number().int().min(1).default(1),
  error: z.string().optional(),
  deliveredAt: z.string().datetime().optional(),
  actorId: z.string(),
});

export const NotificationDeliveryResponseSchema = z.object({
  id: z.string().uuid(),
  notificationId: z.string().uuid(),
  provider: z.string(),
  providerMessageId: z.string().nullable(),
  status: z.string(),
  attempt: z.number(),
  error: z.string().nullable(),
  deliveredAt: z.date().nullable(),
  createdAt: z.date(),
});

// Notification Preference schemas
export const CreateNotificationPreferenceSchema = z.object({
  schoolId: z.string().uuid(),
  guardianId: z.string().uuid(),
  channel: z.enum(["email", "sms", "whatsapp", "push"]),
  category: z.string().min(1).max(100),
  status: z.enum(["subscribed", "unsubscribed"]).default("subscribed"),
  actorId: z.string(),
});

export const UpdateNotificationPreferenceSchema = z.object({
  status: z.enum(["subscribed", "unsubscribed"]).optional(),
});

export const NotificationPreferenceResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  guardianId: z.string().uuid(),
  channel: z.string(),
  category: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Opt-out schemas
export const CreateOptOutSchema = z.object({
  schoolId: z.string().uuid(),
  recipientId: z.string().uuid(),
  channel: z.enum(["email", "sms", "whatsapp", "push"]),
  reason: z.string().min(1).max(500).optional(),
  actorId: z.string(),
});

export const OptOutResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  recipientId: z.string().uuid(),
  channel: z.string(),
  reason: z.string().nullable(),
  createdAt: z.date(),
});

// Provider Config schemas
export const CreateProviderConfigSchema = z.object({
  schoolId: z.string().uuid().optional(),
  provider: z.enum(["resend", "msg91", "whatsapp_bsp", "firebase"]),
  config: z.any(),
  actorId: z.string(),
});

export const ProviderConfigResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid().nullable(),
  provider: z.string(),
  config: z.any(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Message Cost schemas
export const CreateMessageCostSchema = z.object({
  schoolId: z.string().uuid(),
  channel: z.enum(["email", "sms", "whatsapp", "push"]),
  units: z.number().int().min(0),
  costPaise: z.number().int().min(0),
  period: z.string().min(1).max(10), // e.g., "2026-11"
  actorId: z.string(),
});

export const MessageCostResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  channel: z.string(),
  units: z.number(),
  costPaise: z.number(),
  period: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
