import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL ?? "postgres://erp:erp@localhost:5432/erp";

const maxConnections = Number(process.env.PGPOOL_MAX ?? 10);

export const pool = new Pool({
  connectionString,
  max: maxConnections,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export type Db = NodePgDatabase<typeof schema>;

const defaultDb: Db = drizzle(pool, { schema });

/** Request-scoped drizzle handle, bound to a dedicated PoolClient inside an open transaction. */
const als = new AsyncLocalStorage<Db>();

/**
 * Database handle used across the codebase.
 *
 * Outside a request scope it is the pooled owner connection (development default).
 * Inside {@link runWithTenant} it resolves to a dedicated client bound to an open
 * transaction with `app.current_*` GUCs set — so RLS policies apply and the whole
 * request commits or rolls back as one unit of work.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const current = als.getStore() ?? defaultDb;
    const value = Reflect.get(current as object, prop);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(current)
      : value;
  },
});

export interface ScopedTenant {
  schoolId?: string | null;
  userId?: string | null;
  orgId?: string | null;
  isPlatformAdmin?: boolean;
  impersonationId?: string | null;
}

/** Optional pool to use instead of the default (used by tests to inject the erp_app role). */
export type ScopedPool = Pick<Pool, "connect">;

/**
 * Runs `fn` inside a single transaction on a dedicated client with RLS GUCs set
 * from `ctx`. Commits when `fn` resolves; rolls back when `fn` throws.
 *
 * The scoped drizzle handle is visible to every service through the exported `db`.
 */
export async function runWithTenant<T>(
  ctx: ScopedTenant,
  fn: (scoped: Db) => Promise<T>,
  scopedPool: ScopedPool = pool,
): Promise<T> {
  const client: PoolClient = (await scopedPool.connect()) as PoolClient;
  const originalQuery = client.query;
  const rawQuery = originalQuery.bind(client);

  // drizzle's db.transaction() on a non-Pool (single-client) instance cannot detect
  // that a transaction is already open, so it emits its own top-level begin/commit on
  // the same client — which would finalize this scope's transaction early.
  // Translate only those drizzle-emitted markers into savepoints; everything else
  // passes through untouched. The scope's own begin/commit/rollback bypass the
  // wrapper entirely via rawQuery above.
  let nested = 0;
  const translate = (raw: string): string | null => {
    const t = raw.trim().toLowerCase();
    if (t === "begin" || t.startsWith("begin ")) {
      nested += 1;
      return `savepoint erp_sp_${nested}`;
    }
    if (t === "commit" || t.startsWith("commit ")) {
      if (nested > 0) {
        const mark = `erp_sp_${nested}`;
        nested -= 1;
        return `release savepoint ${mark}`;
      }
      return null; // real commit: let pg handle it
    }
    if (t === "rollback") {
      if (nested > 0) {
        const mark = `erp_sp_${nested}`;
        nested -= 1;
        return `rollback to savepoint ${mark}`;
      }
      return null; // real rollback: let pg handle it
    }
    return null;
  };
  const wrappedQuery = ((text: unknown, ...rest: unknown[]) => {
    // String form: client.query("begin")
    if (typeof text === "string") {
      const translated = translate(text);
      if (translated) return rawQuery(translated, ...(rest as []));
      return (rawQuery as (...args: unknown[]) => unknown)(text, ...rest);
    }
    // Config-object form (drizzle): client.query({ text: "begin", types: {...} })
    if (text && typeof text === "object" && typeof (text as { text?: unknown }).text === "string") {
      const config = text as { text: string } & Record<string, unknown>;
      const translated = translate(config.text);
      if (translated) return rawQuery({ ...config, text: translated }, ...(rest as []));
    }
    return (rawQuery as (...args: unknown[]) => unknown)(text, ...rest);
  }) as typeof client.query;
  (client as { query: typeof client.query }).query = wrappedQuery;

  try {
    await rawQuery("begin");
    // GUCs are set at SESSION level (is_local = false) on purpose: drizzle's nested
    // db.transaction() emits begin/commit on this same client, which would silently
    // drop transaction-local settings mid-request. The scope resets every GUC to ''
    // before the client returns to the pool, so nothing leaks across requests.
    const set = (key: string, value: string) =>
      client.query("select set_config($1, $2, false)", [key, value]);
    await set("app.current_school_id", ctx.schoolId ?? "");
    await set("app.current_user_id", ctx.userId ?? "");
    await set("app.current_org_id", ctx.orgId ?? "");
    await set("app.is_platform_admin", ctx.isPlatformAdmin ? "true" : "false");
    await set("app.impersonation_id", ctx.impersonationId ?? "");

    const scoped: Db = drizzle(client, { schema });
    const result = await als.run(scoped, () => fn(scoped));
    await rawQuery("commit");
    return result;
  } catch (error) {
    try {
      await rawQuery("rollback");
    } catch {
      // connection may already be broken; nothing useful to do beyond releasing
    }
    throw error;
  } finally {
    try {
      // Defensive: close any stray transaction drizzle nesting may have left open,
      // then clear the session GUCs so this connection can safely re-enter the pool.
      await rawQuery("rollback").catch(() => undefined);
    } catch {
      // never block release
    }
    try {
      await rawQuery(
        `select
           set_config('app.current_school_id', '', false),
           set_config('app.current_user_id', '', false),
           set_config('app.current_org_id', '', false),
           set_config('app.is_platform_admin', '', false),
           set_config('app.impersonation_id', '', false)`,
      );
    } catch {
      // resetting GUCs is best-effort; never block release
    }
    // Restore the unwrapped query so pooled connections carry no per-scope state.
    (client as { query: typeof client.query }).query = originalQuery;
    client.release();
  }
}
