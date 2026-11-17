import { z } from "zod";

export const CreatePeriodSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(40),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "HH:MM"),
  order: z.number().int().min(1).default(1),
  actorId: z.string(),
});

export const CreateRoomSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(80),
  capacity: z.number().int().positive().optional(),
  building: z.string().max(80).optional(),
  type: z.string().max(20).default("classroom"),
  actorId: z.string(),
});

export const SetEntrySchema = z.object({
  schoolId: z.string().uuid(),
  sectionId: z.string().uuid(),
  dayOfWeek: z.number().int().min(1).max(6),
  periodId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  room: z.string().max(80).optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  notes: z.string().max(400).optional(),
  actorId: z.string(),
});
