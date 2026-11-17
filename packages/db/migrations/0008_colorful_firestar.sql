CREATE TABLE IF NOT EXISTS "rooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"building" text,
	"type" text DEFAULT 'classroom' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_school_id_name_unique" UNIQUE("school_id","name")
);
--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "room_id" uuid;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_school_id_section_id_day_of_week_period_id_unique" UNIQUE("school_id","section_id","day_of_week","period_id");--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_school_id_teacher_id_day_of_week_period_id_unique" UNIQUE("school_id","teacher_id","day_of_week","period_id");--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_school_id_room_id_day_of_week_period_id_unique" UNIQUE("school_id","room_id","day_of_week","period_id");--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rooms" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "rooms_tenant" ON "rooms" USING (school_id = app.current_school_id()) WITH CHECK (school_id = app.current_school_id());
