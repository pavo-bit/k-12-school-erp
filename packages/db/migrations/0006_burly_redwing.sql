CREATE TABLE IF NOT EXISTS "daily_attendance_summaries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"date" date NOT NULL,
	"present_count" integer DEFAULT 0 NOT NULL,
	"absent_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_attendance_summaries_school_id_section_id_date_unique" UNIQUE("school_id","section_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_fee_summaries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"date" date NOT NULL,
	"collected_paise" bigint DEFAULT 0 NOT NULL,
	"outstanding_paise" bigint DEFAULT 0 NOT NULL,
	"invoice_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_fee_summaries_school_id_academic_year_id_date_unique" UNIQUE("school_id","academic_year_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollment_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"section_id" uuid,
	"student_count" integer DEFAULT 0 NOT NULL,
	"snapshot_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_snapshots_school_id_academic_year_id_class_id_section_id_snapshot_date_unique" UNIQUE("school_id","academic_year_id","class_id","section_id","snapshot_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"object_path" text,
	"requested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"frequency" text NOT NULL,
	"recipients" text NOT NULL,
	"next_run_at" timestamp with time zone NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
-- RLS for reports tables
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['daily_attendance_summaries','daily_fee_summaries','enrollment_snapshots','report_jobs','scheduled_reports']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_tenant ON %I USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id())', t, t);
  END LOOP;
END $$;
