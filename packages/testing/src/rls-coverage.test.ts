import { describe, it, expect } from "vitest";
import { withClient, SUPERUSER_URL } from "./helpers.js";

/**
 * Guards the multi-tenancy hardening in packages/db/migrations/0007_rls_hardening.sql.
 *
 * Every public table must be either
 *   (a) RLS-enabled + FORCED with at least one policy (tenant, user, or parent-scoped), or
 *   (b) in the intentional global-reference allowlist below, where erp_app is read-only.
 */
const GLOBAL_READONLY = new Set(["entitlements", "permissions", "plans", "role_permissions"]);

interface TableRow {
  tablename: string;
  relrowsecurity: boolean;
  relforcerowsecurity: boolean;
  policy_count: string;
}

describe("RLS coverage across all public tables", () => {
  it("no unexpected table is missing RLS", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query<TableRow>(`
        select c.relname as tablename,
               c.relrowsecurity,
               c.relforcerowsecurity,
               (select count(*) from pg_policies p
                 where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r'
         order by c.relname
      `);
      expect(rows.length).toBeGreaterThan(50);

      const missing = rows
        .filter((r) => !r.relrowsecurity)
        .map((r) => r.tablename)
        .filter((t) => !GLOBAL_READONLY.has(t));
      expect(missing, `tables without RLS: ${missing.join(", ")}`).toEqual([]);
    });
  });

  it("every RLS-enabled table is also FORCED", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query<TableRow>(`
        select c.relname as tablename, c.relrowsecurity, c.relforcerowsecurity,
               '0' as policy_count
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r'
      `);
      const notForced = rows
        .filter((r) => r.relrowsecurity && !r.relforcerowsecurity)
        .map((r) => r.tablename);
      expect(notForced, `tables with RLS but without FORCE: ${notForced.join(", ")}`).toEqual([]);
    });
  });

  it("secret tables carry no permissive policy for erp_app", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query<{ tablename: string; n: string }>(
        `select tablename, count(*) as n from pg_policies
          where schemaname = 'public' and tablename in ('otp_challenges','gateway_events','verifications')
          group by tablename`,
      );
      // These are enabled with zero permissive policies for erp_app by design.
      expect(rows.length).toBe(0);
    });
  });

  it("global-reference tables are read-only for erp_app", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query<{ table_name: string; privilege_type: string }>(
        `select table_name, privilege_type
           from information_schema.role_table_grants
          where grantee = 'erp_app'
            and table_schema = 'public'
            and table_name in ('entitlements','permissions','plans','role_permissions')
            and privilege_type in ('INSERT','UPDATE','DELETE')`,
      );
      expect(rows, `erp_app must not hold write grants: ${JSON.stringify(rows)}`).toEqual([]);
    });
  });
});
