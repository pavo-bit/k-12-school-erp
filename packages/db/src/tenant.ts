import type { Db } from "./client.js";

export interface TenantContext {
  schoolId: string;
  userId?: string;
  orgId?: string;
  isPlatformAdmin?: boolean;
  impersonationId?: string;
}

export async function withTenantContext<T>(
  db: Db,
  ctx: TenantContext,
  fn: (tx: Db) => Promise<T>,
): Promise<T> {
  // Placeholder: begin transaction, SET LOCAL context, run fn, commit/rollback.
  // Implemented in Milestone 1 with a real transaction wrapper.
  return fn(db);
}
