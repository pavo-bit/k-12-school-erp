DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['enquiries','applications']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id())', t, t);
  END LOOP;
END $$;