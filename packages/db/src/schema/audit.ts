import { index, pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey(),
    scope: text("scope").notNull().default("school"),
    schoolId: uuid("school_id"),
    actorId: uuid("actor_id"),
    actorType: text("actor_type"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    schoolCreatedIdx: index("audit_logs_school_created_idx").on(t.schoolId, t.createdAt),
    entityIdx: index("audit_logs_entity_idx").on(t.schoolId, t.entityType, t.entityId),
  }),
);
