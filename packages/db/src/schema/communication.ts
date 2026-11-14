import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    key: text("key").notNull(),
    channel: text("channel").notNull(),
    language: text("language").notNull().default("en"),
    body: text("body").notNull(),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueTemplate: unique().on(t.schoolId, t.key, t.channel, t.language),
  }),
);

export const templateVersions = pgTable("template_versions", {
  id: uuid("id").primaryKey(),
  templateId: uuid("template_id").notNull(),
  version: integer("version").notNull(),
  body: text("body").notNull(),
  variables: text("variables"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const templateApprovals = pgTable("template_approvals", {
  id: uuid("id").primaryKey(),
  templateId: uuid("template_id").notNull(),
  provider: text("provider").notNull(),
  providerTemplateId: text("provider_template_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  audience: text("audience").notNull(),
  status: text("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcementAudiences = pgTable("announcement_audiences", {
  id: uuid("id").primaryKey(),
  announcementId: uuid("announcement_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  eventKey: text("event_key").notNull(),
  recipientId: uuid("recipient_id").notNull(),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: uuid("id").primaryKey(),
  notificationId: uuid("notification_id").notNull(),
  provider: text("provider").notNull(),
  providerMessageId: text("provider_message_id"),
  status: text("status").notNull().default("pending"),
  attempt: integer("attempt").notNull().default(1),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  channel: text("channel").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("enabled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const optOuts = pgTable("opt_outs", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  channel: text("channel").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerConfigs = pgTable("provider_configs", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id"),
  provider: text("provider").notNull(),
  config: text("config").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messageCosts = pgTable("message_costs", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  channel: text("channel").notNull(),
  units: integer("units").notNull().default(0),
  costPaise: integer("cost_paise").notNull().default(0),
  period: text("period").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
