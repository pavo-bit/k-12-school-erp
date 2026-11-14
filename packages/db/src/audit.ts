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

// Implemented in Milestone 1.
export async function writeAudit(_input: AuditInput): Promise<void> {
  throw new Error("not_implemented");
}
