-- RLS helper functions
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_school_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_school_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.current_org_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.is_platform_admin', true), 'false') = 'true'
$$;

GRANT USAGE ON SCHEMA public TO erp_app;
GRANT USAGE ON SCHEMA app TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erp_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO erp_app;

-- RLS for platform/identity tenant tables
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings FORCE ROW LEVEL SECURITY;
CREATE POLICY school_settings_tenant ON school_settings USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id());

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years FORCE ROW LEVEL SECURITY;
CREATE POLICY academic_years_tenant ON academic_years USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id());

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY memberships_tenant ON memberships USING (school_id = app.current_school_id() OR user_id = app.current_user_id()) WITH CHECK (school_id = app.current_school_id());

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
CREATE POLICY invitations_tenant ON invitations USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id());

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys FORCE ROW LEVEL SECURITY;
CREATE POLICY idempotency_keys_tenant ON idempotency_keys USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id());

ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sequences FORCE ROW LEVEL SECURITY;
CREATE POLICY document_sequences_tenant ON document_sequences USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id());

ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records FORCE ROW LEVEL SECURITY;
CREATE POLICY usage_records_tenant ON usage_records USING (school_id = app.current_school_id() OR app.is_platform_admin()) WITH CHECK (school_id = app.current_school_id() OR app.is_platform_admin());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_access ON audit_logs USING (school_id = app.current_school_id() OR (school_id IS NULL AND app.is_platform_admin())) WITH CHECK (school_id = app.current_school_id() OR (school_id IS NULL AND app.is_platform_admin()));

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools FORCE ROW LEVEL SECURITY;
CREATE POLICY schools_access ON schools USING (id = app.current_school_id() OR organization_id = app.current_org_id() OR app.is_platform_admin()) WITH CHECK (id = app.current_school_id() OR app.is_platform_admin());

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY organizations_access ON organizations USING (id = app.current_org_id() OR app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

REVOKE UPDATE, DELETE ON audit_logs FROM erp_app;

-- RLS for academics
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['classes','sections','subjects','class_subjects','teacher_assignments']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id())', t, t);
  END LOOP;
END $$;

-- RLS for students
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['students','student_guardians','enrollments','student_documents','student_consents']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id())', t, t);
  END LOOP;
END $$;

-- RLS for attendance
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['holidays','periods','timetable_slots','attendance_sessions','attendance_records','staff_attendance','sync_operations']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id())', t, t);
  END LOOP;
END $$;

-- RLS for fees
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['fee_heads','fee_structures','fee_structure_lines','fee_assignments','concessions','invoices','invoice_lines','payments','payment_allocations','receipts','credit_notes','refunds','gateway_orders','reconciliation_runs','reconciliation_exceptions']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id())', t, t);
  END LOOP;
END $$;