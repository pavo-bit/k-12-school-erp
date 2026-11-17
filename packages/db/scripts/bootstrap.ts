/**
 * Idempotent bootstrap for a fresh Postgres: creates the runtime roles used by
 * the app and the migration runner, and grants them the minimum privileges.
 *
 * Roles:
 *   - erp (superuser created by the postgres image, owner of the app DB)
 *   - erp_app    : runtime role, RLS-enforced, NO BYPASSRLS
 *   - erp_auth   : authentication role, BYPASSRLS (login/session/slug lookup)
 *   - erp_migrations : DDL role for drizzle migrations, BYPASSRLS
 *
 * Run against the target database:
 *   DATABASE_URL=postgres://postgres:postgres@localhost:5432/erp pnpm --filter @school-erp/db bootstrap
 */
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required (use the superuser/owner role).");
}

const APP_PASSWORD = process.env.ERP_APP_PASSWORD ?? "erp_app";
const AUTH_PASSWORD = process.env.ERP_AUTH_PASSWORD ?? "erp_auth";
const MIGRATIONS_PASSWORD = process.env.ERP_MIGRATIONS_PASSWORD ?? "erp_migrations";

const pool = new Pool({ connectionString });

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app LOGIN PASSWORD '${APP_PASSWORD}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE erp_app WITH LOGIN PASSWORD '${APP_PASSWORD}' NOSUPERUSER NOBYPASSRLS;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_auth') THEN
    CREATE ROLE erp_auth LOGIN PASSWORD '${AUTH_PASSWORD}' NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE erp_auth WITH LOGIN PASSWORD '${AUTH_PASSWORD}' BYPASSRLS;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_migrations') THEN
    CREATE ROLE erp_migrations LOGIN PASSWORD '${MIGRATIONS_PASSWORD}' NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE erp_migrations WITH LOGIN PASSWORD '${MIGRATIONS_PASSWORD}' BYPASSRLS;
  END IF;
END
$$;
`;

// GRANT CONNECT with a dynamic database name cannot run inside a DO block; split it out.
const dbName = connectionString.split("/").pop()?.split("?")[0] ?? "erp";

const statements = [
  sql,
  `GRANT CONNECT ON DATABASE "${dbName}" TO erp_app, erp_auth, erp_migrations;`,
  `GRANT USAGE, CREATE ON SCHEMA public TO erp_migrations;`,
  `GRANT USAGE ON SCHEMA public TO erp_app, erp_auth;`,
  `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erp_auth;`,
  `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_auth;`,
  `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_auth;`,
  `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO erp_auth;`,
];

try {
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log(`db-bootstrap: roles erp_app, erp_auth and erp_migrations ready (db "${dbName}")`);
} catch (error) {
  console.error("db-bootstrap failed:", error);
  process.exit(1);
} finally {
  await pool.end();
}
