import { describe, it, expect, beforeAll } from "vitest";
import {
  asTenantApp,
  asUserApp,
  withClient,
  SUPERUSER_URL,
  APP_URL,
  GREENWOOD_SCHOOL_ID,
  BOGUS_SCHOOL_ID,
} from "./helpers.js";

/**
 * Proves tenant isolation from the perspective of the production runtime role (erp_app).
 * The web app in development connects as the owner role (RLS-bypassed); these tests are
 * the contract that the production posture (erp_app + request-scoped tenant context) holds.
 *
 * The seeded tenant is located by slug so the suite works on any freshly migrated+seeded
 * database, not just the local development one.
 */
let greenwoodId = GREENWOOD_SCHOOL_ID;

beforeAll(async () => {
  try {
    const found = await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        "select id from schools where slug = 'greenwood' limit 1",
      );
      return (rows[0]?.id as string | undefined) ?? null;
    });
    if (found) greenwoodId = found;
  } catch {
    // keep default; assertions degrade to vacuous 0 === 0 on an empty database
  }
});

describe("tenant isolation as erp_app", () => {
  it("greenwood sees its own students, bogus school sees none", async () => {
    const seeded = await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        "select count(*)::int as n from students where school_id = $1",
        [greenwoodId],
      );
      return rows[0].n as number;
    });

    await asTenantApp(greenwoodId, async (client) => {
      const { rows } = await client.query("select count(*)::int as n from students");
      expect(rows[0].n).toBe(seeded);
    });

    await asTenantApp(BOGUS_SCHOOL_ID, async (client) => {
      const { rows } = await client.query("select count(*)::int as n from students");
      expect(rows[0].n).toBe(0);
    });
  });

  it.each([
    "marks",
    "exams",
    "exam_terms",
    "outbox_events",
    "results",
    "report_cards",
    "provider_configs",
    "statutory_rates",
  ])("bogus school sees zero rows in %s", async (table) => {
    await asTenantApp(BOGUS_SCHOOL_ID, async (client) => {
      const { rows } = await client.query(`select count(*)::int as n from ${table}`);
      expect(rows[0].n).toBe(0);
    });
  });

  it("no context at all sees zero students", async () => {
    await withClient(APP_URL, async (client) => {
      const { rows } = await client.query("select count(*)::int as n from students");
      expect(rows[0].n).toBe(0);
    });
  });

  it("child tables (announcement_audiences) are invisible to foreign tenants", async () => {
    await asTenantApp(BOGUS_SCHOOL_ID, async (client) => {
      const { rows } = await client.query("select count(*)::int as n from announcement_audiences");
      expect(rows[0].n).toBe(0);
    });
  });

  it("child tables stay consistent for the owning tenant (count matches parent join)", async () => {
    await asTenantApp(greenwoodId, async (client) => {
      const { rows } = await client.query(
        `select count(*)::int as n
           from announcement_audiences aa
           join announcements a on a.id = aa.announcement_id
          where a.school_id = $1`,
        [greenwoodId],
      );
      const own = await client.query("select count(*)::int as n from announcement_audiences");
      // Policy must never hide rows belonging to the current school.
      expect(own.rows[0].n).toBe(rows[0].n);
    });
  });

  it("users are visible only to themselves", async () => {
    const anyUserId = await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query("select id from users limit 1");
      return (rows[0] as { id: string } | undefined)?.id ?? null;
    });
    if (!anyUserId) return; // empty database: nothing to prove

    await asUserApp(anyUserId, async (client) => {
      const { rows } = await client.query("select id from users");
      for (const row of rows as Array<{ id: string }>) {
        expect(row.id).toBe(anyUserId);
      }
    });

    await asUserApp(BOGUS_SCHOOL_ID.replace(/0/g, "f").slice(0, 36), async (client) => {
      const { rows } = await client.query("select count(*)::int as n from users");
      expect(rows[0].n).toBe(0);
    });
  });

  it("otp_challenges is not readable by erp_app at all", async () => {
    await withClient(APP_URL, async (client) => {
      await expect(client.query("select count(*) from otp_challenges")).rejects.toThrow(
        /permission denied/i,
      );
    });
  });

  it("gateway_events is not readable by erp_app at all", async () => {
    await withClient(APP_URL, async (client) => {
      await expect(client.query("select count(*) from gateway_events")).rejects.toThrow(
        /permission denied/i,
      );
    });
  });

  it("global reference tables are readable but not writable by erp_app", async () => {
    await withClient(APP_URL, async (client) => {
      const { rows } = await client.query("select count(*)::int as n from plans");
      expect(typeof rows[0].n).toBe("number");
      await expect(
        client.query(
          "insert into plans (id, key, name, created_at) values (gen_random_uuid(), 'x', 'x', now())",
        ),
      ).rejects.toThrow(/permission denied/i);
    });
  });
});
