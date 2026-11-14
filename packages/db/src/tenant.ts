import { sql } from "drizzle-orm";
import type { Db } from "./client";

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
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_school_id', ${ctx.schoolId}, true)`);
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${ctx.userId ?? ""}, true)`);
    await tx.execute(sql`SELECT set_config('app.current_org_id', ${ctx.orgId ?? ""}, true)`);
    await tx.execute(
      sql`SELECT set_config('app.is_platform_admin', ${ctx.isPlatformAdmin ? "true" : "false"}, true)`,
    );
    await tx.execute(
      sql`SELECT set_config('app.impersonation_id', ${ctx.impersonationId ?? ""}, true)`,
    );
    return fn(tx as unknown as Db);
  });
}
