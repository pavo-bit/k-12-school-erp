-- 0007_rls_hardening.sql
-- Close the RLS coverage gap found by audit: 38 of 104 tables had RLS disabled,
-- leaving tenant data (marks, exams, results, report cards, notifications, outbox,
-- identity) readable/writable by any role with table grants.
--
-- Classes:
--   A. School-scoped tables            -> ENABLE + FORCE RLS, tenant policy (NULL school_id tolerated for global seed rows)
--   B. User-scoped identity tables     -> ENABLE + FORCE RLS, owner policy via app.current_user_id()
--   C. Child tables (tenant via parent FK) -> ENABLE + FORCE RLS, EXISTS policy against school-scoped parent
--   D. Global platform reference       -> remain RLS-disabled intentionally; erp_app is read-only
--   E. Platform secrets                -> RLS with no permissive policy + privileges revoked from erp_app

-- ========== A. School-scoped ==========
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'exam_terms','exam_subjects','exams','grading_schemes','impersonation_sessions',
    'mark_submissions','marks','outbox_events','provider_configs',
    'report_card_templates','report_cards','results','roles','statutory_rates'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id() OR school_id IS NULL) WITH CHECK (school_id = app.current_school_id() OR school_id IS NULL)',
      t, t
    );
  END LOOP;
END $$;

-- ========== B. User-scoped identity (Better Auth / device / preference) ==========
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'accounts','sessions','two_factor','mobile_sessions','mobile_devices',
    'notification_preferences','opt_outs','guardians'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I_owner ON %I USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id())',
      t, t
    );
  END LOOP;
END $$;

-- ========== C. Child tables scoped through a school-scoped parent ==========
ALTER TABLE admission_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_status_history FORCE ROW LEVEL SECURITY;
CREATE POLICY admission_status_history_tenant ON admission_status_history
  USING (EXISTS (SELECT 1 FROM applications p WHERE p.id = application_id AND p.school_id = app.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM applications p WHERE p.id = application_id AND p.school_id = app.current_school_id()));

ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes FORCE ROW LEVEL SECURITY;
CREATE POLICY application_notes_tenant ON application_notes
  USING (EXISTS (SELECT 1 FROM applications p WHERE p.id = application_id AND p.school_id = app.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM applications p WHERE p.id = application_id AND p.school_id = app.current_school_id()));

ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_corrections FORCE ROW LEVEL SECURITY;
CREATE POLICY attendance_corrections_tenant ON attendance_corrections
  USING (EXISTS (SELECT 1 FROM attendance_records p WHERE p.id = attendance_record_id AND p.school_id = app.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM attendance_records p WHERE p.id = attendance_record_id AND p.school_id = app.current_school_id()));

ALTER TABLE announcement_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_audiences FORCE ROW LEVEL SECURITY;
CREATE POLICY announcement_audiences_tenant ON announcement_audiences
  USING (EXISTS (SELECT 1 FROM announcements p WHERE p.id = announcement_id AND p.school_id = app.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM announcements p WHERE p.id = announcement_id AND p.school_id = app.current_school_id()));

ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_deliveries_tenant ON notification_deliveries
  USING (EXISTS (SELECT 1 FROM notifications p WHERE p.id = notification_id AND p.school_id = app.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM notifications p WHERE p.id = notification_id AND p.school_id = app.current_school_id()));

ALTER TABLE grade_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_bands FORCE ROW LEVEL SECURITY;
CREATE POLICY grade_bands_tenant ON grade_bands
  USING (EXISTS (SELECT 1 FROM grading_schemes p WHERE p.id = grading_scheme_id AND (p.school_id = app.current_school_id() OR p.school_id IS NULL)))
  WITH CHECK (EXISTS (SELECT 1 FROM grading_schemes p WHERE p.id = grading_scheme_id AND (p.school_id = app.current_school_id() OR p.school_id IS NULL)));

ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY template_versions_tenant ON template_versions
  USING (EXISTS (SELECT 1 FROM notification_templates p WHERE p.id = template_id AND p.school_id = app.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM notification_templates p WHERE p.id = template_id AND p.school_id = app.current_school_id()));

ALTER TABLE template_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_approvals FORCE ROW LEVEL SECURITY;
CREATE POLICY template_approvals_tenant ON template_approvals
  USING (EXISTS (SELECT 1 FROM notification_templates p WHERE p.id = template_id AND p.school_id = app.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM notification_templates p WHERE p.id = template_id AND p.school_id = app.current_school_id()));

-- ========== users: self-visibility only; no writes for erp_app ==========
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_self ON users
  USING (id = app.current_user_id())
  WITH CHECK (id = app.current_user_id());
REVOKE INSERT, UPDATE, DELETE ON users FROM erp_app;

-- ========== E. Platform secrets: denied for erp_app ==========
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications FORCE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON verifications FROM erp_app;

ALTER TABLE otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_challenges FORCE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON otp_challenges FROM erp_app;

ALTER TABLE gateway_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_events FORCE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON gateway_events FROM erp_app;

-- ========== D. Global platform reference: read-only for erp_app ==========
REVOKE INSERT, UPDATE, DELETE ON plans FROM erp_app;
REVOKE INSERT, UPDATE, DELETE ON permissions FROM erp_app;
REVOKE INSERT, UPDATE, DELETE ON role_permissions FROM erp_app;
REVOKE INSERT, UPDATE, DELETE ON entitlements FROM erp_app;
