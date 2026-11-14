import { db } from "./client";
import { auditLogs } from "./schema/index";

export interface AuditInput {
  scope: "school" | "platform";
  schoolId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    scope: input.scope,
    schoolId: input.schoolId,
    actorId: input.actorId,
    actorType: "user",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before ?? null,
    after: input.after ?? null,
    requestId: input.requestId ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });
}
