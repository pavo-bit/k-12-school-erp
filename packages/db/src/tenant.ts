import type { Db } from "./client";
import { runWithTenant } from "./client";

export interface TenantContext {
  schoolId: string;
  userId?: string;
  orgId?: string;
  isPlatformAdmin?: boolean;
  impersonationId?: string;
}

/**
 * @deprecated Prefer runWithTenant from ./client — kept for API compatibility.
 *
 * Runs `fn` inside one transaction on a dedicated client with RLS GUCs set from `ctx`.
 * The `db` argument is ignored: the scoped handle is exported as `db` from ./client
 * and resolved through AsyncLocalStorage for the duration of the callback.
 */
export async function withTenantContext<T>(
  _db: Db,
  ctx: TenantContext,
  fn: (tx: Db) => Promise<T>,
): Promise<T> {
  return runWithTenant(
    {
      schoolId: ctx.schoolId,
      userId: ctx.userId,
      orgId: ctx.orgId,
      isPlatformAdmin: ctx.isPlatformAdmin,
      impersonationId: ctx.impersonationId,
    },
    fn,
  );
}
