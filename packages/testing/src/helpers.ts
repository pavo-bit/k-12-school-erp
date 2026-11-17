import { Client } from "pg";

/**
 * Shared test helpers.
 *
 * Two roles matter for these tests:
 *   - DATABASE_URL           superuser/owner (bypasses RLS) â€” used for setup and control queries
 *   - TEST_APP_DATABASE_URL  erp_app runtime role (NO BYPASSRLS) â€” used to prove tenant isolation
 *
 * Defaults point at the local Docker Postgres published on port 5435.
 * In CI, both are provided by the workflow.
 */
export const SUPERUSER_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://erp:erp@localhost:5435/erp";

export const APP_URL =
  process.env.TEST_APP_DATABASE_URL ?? "postgres://erp_app:erp_app@localhost:5435/erp";

export const GREENWOOD_SCHOOL_ID =
  process.env.TEST_SCHOOL_ID ?? "e9b21e11-9fc2-497b-911b-c347a0f0ecc4";

export const BOGUS_SCHOOL_ID = "00000000-0000-0000-0000-000000000000";

export async function withClient<T>(url: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
  } catch (error) {
    throw new Error(
      `Cannot connect to Postgres at ${url.split("@")[1] ?? url}. ` +
        `Start the database (docker compose up -d postgres) and run pnpm db:bootstrap && pnpm db:migrate && pnpm db:seed.`,
      { cause: error },
    );
  }
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Run fn inside a transaction on the app (erp_app) connection with a tenant context. Always rolls back. */
export async function asTenantApp(schoolId: string, fn: (client: Client) => Promise<void>) {
  await withClient(APP_URL, async (client) => {
    await client.query("begin");
    try {
      await client.query("select set_config('app.current_school_id', $1, true)", [schoolId]);
      await fn(client);
    } finally {
      await client.query("rollback");
    }
  });
}

/** Run fn inside a transaction on the app (erp_app) connection with a user context. Always rolls back. */
export async function asUserApp(userId: string, fn: (client: Client) => Promise<void>) {
  await withClient(APP_URL, async (client) => {
    await client.query("begin");
    try {
      await client.query("select set_config('app.current_user_id', $1, true)", [userId]);
      await fn(client);
    } finally {
      await client.query("rollback");
    }
  });
}
