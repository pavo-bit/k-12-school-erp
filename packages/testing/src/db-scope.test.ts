import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { eq, count } from "drizzle-orm";
import { db, runWithTenant, students } from "@school-erp/db";
import {
  withClient,
  SUPERUSER_URL,
  APP_URL,
  GREENWOOD_SCHOOL_ID,
  BOGUS_SCHOOL_ID,
} from "./helpers";

/**
 * Verifies the AsyncLocalStorage-scoped database handle that production request
 * processing relies on (apps/web withApi → runWithTenant):
 *   - the shared `db` export resolves to the scoped connection inside a scope
 *   - RLS GUCs apply per scope (own tenant visible, foreign/no tenant invisible)
 *   - success commits, failure rolls back — no partial request writes
 *   - nested db.transaction inside a scope works via savepoints
 */
const appPool = new Pool({ connectionString: APP_URL, max: 2 });

let greenwoodId = GREENWOOD_SCHOOL_ID;

beforeAll(async () => {
  const found = await withClient(SUPERUSER_URL, async (client) => {
    const { rows } = await client.query("select id from schools where slug = 'greenwood' limit 1");
    return (rows[0] as { id: string } | undefined)?.id ?? null;
  });
  if (found) greenwoodId = found;
});

afterAll(async () => {
  await appPool.end();
});

describe("runWithTenant scoped connection", () => {
  it("resolves the shared db handle to the scoped connection", async () => {
    const scoped = await runWithTenant(
      { schoolId: greenwoodId },
      async () => {
        const rows = await db.select({ n: count() }).from(students);
        return Number(rows[0]?.n ?? 0);
      },
      appPool,
    );
    const expected = await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        "select count(*)::int as n from students where school_id = $1",
        [greenwoodId],
      );
      return rows[0].n as number;
    });
    expect(scoped).toBe(expected);
  });

  it("foreign tenant scope sees nothing", async () => {
    const scoped = await runWithTenant(
      { schoolId: BOGUS_SCHOOL_ID },
      async () => {
        const rows = await db.select({ n: count() }).from(students);
        return Number(rows[0]?.n ?? -1);
      },
      appPool,
    );
    expect(scoped).toBe(0);
  });

  it("rolls back all writes when the handler throws", async () => {
    const marker = `SCOPE-ROLLBACK-${Date.now()}`;
    await expect(
      runWithTenant(
        { schoolId: greenwoodId },
        async () => {
          await db.insert(students).values({
            id: randomUUID(),
            schoolId: greenwoodId,
            admissionNumber: marker,
            firstName: "Scope",
            lastName: "Rollback",
            dateOfBirth: "2014-01-01",
            gender: "other",
          });
          throw new Error("boom");
        },
        appPool,
      ),
    ).rejects.toThrow("boom");

    const persisted = await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        "select count(*)::int as n from students where admission_number = $1",
        [marker],
      );
      return rows[0].n as number;
    });
    expect(persisted).toBe(0);
  });

  it("commits writes when the handler succeeds, then cleans up", async () => {
    const marker = `SCOPE-COMMIT-${Date.now()}`;
    await runWithTenant(
      { schoolId: greenwoodId },
      async () => {
        await db.insert(students).values({
          id: randomUUID(),
          schoolId: greenwoodId,
          admissionNumber: marker,
          firstName: "Scope",
          lastName: "Commit",
          dateOfBirth: "2014-01-01",
          gender: "other",
        });
      },
      appPool,
    );

    const persisted = await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        "select count(*)::int as n from students where admission_number = $1",
        [marker],
      );
      return rows[0].n as number;
    });
    expect(persisted).toBe(1);

    await withClient(SUPERUSER_URL, async (client) => {
      await client.query("delete from students where admission_number = $1", [marker]);
    });
  });

  it("nested db.transaction inside a scope uses savepoints and outer rollback undoes it", async () => {
    const marker = `SCOPE-NESTED-${Date.now()}`;
    await expect(
      runWithTenant(
        { schoolId: greenwoodId },
        async () => {
          await db.transaction(async (tx) => {
            await tx.insert(students).values({
              id: randomUUID(),
              schoolId: greenwoodId,
              admissionNumber: marker,
              firstName: "Scope",
              lastName: "Nested",
              dateOfBirth: "2014-01-01",
              gender: "other",
            });
          });
          const inside = await db
            .select({ n: count() })
            .from(students)
            .where(eq(students.admissionNumber, marker));
          expect(Number(inside[0]?.n ?? 0)).toBe(1);
          // Abort the outer request scope — the nested insert must vanish with it.
          throw new Error("outer-abort");
        },
        appPool,
      ),
    ).rejects.toThrow("outer-abort");

    const persisted = await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        "select count(*)::int as n from students where admission_number = $1",
        [marker],
      );
      return rows[0].n as number;
    });
    expect(persisted).toBe(0);
  });
});
