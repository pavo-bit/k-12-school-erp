import { pgTable, text, integer, timestamp, uuid, unique } from "drizzle-orm/pg-core";

/**
 * Timetable — structured rooms only.
 * The grid itself lives in `periods` and `timetable_slots` (see attendance.ts):
 *   periods         → master slots (P1 08:00–08:45, ...)
 *   timetable_slots → section × day × period → subject/teacher/room
 */
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    name: text("name").notNull(),
    capacity: integer("capacity"),
    building: text("building"),
    type: text("type").notNull().default("classroom"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSchoolRoom: unique().on(t.schoolId, t.name),
  }),
);
