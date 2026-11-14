DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['staff','staff_documents','leave_types','leave_policies','leave_balances','leave_requests','salary_components','salary_structures','salary_structure_lines','payroll_runs','payroll_items','payslips','payroll_adjustments']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id())', t, t);
  END LOOP;
END $$;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['notification_templates','announcements','notifications','message_costs']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id())', t, t);
  END LOOP;
END $$;