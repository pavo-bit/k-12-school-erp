-- Idempotent bootstrap for a fresh Postgres container.
-- Mounted into /docker-entrypoint-initdb.d/ and executed as POSTGRES_USER (superuser).
-- Creates the runtime roles used by the app and the migration runner.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app LOGIN PASSWORD 'erp_app' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_migrations') THEN
    CREATE ROLE erp_migrations LOGIN PASSWORD 'erp_migrations' NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE erp TO erp_app, erp_migrations;
GRANT USAGE, CREATE ON SCHEMA public TO erp_migrations;
GRANT USAGE ON SCHEMA public TO erp_app;
