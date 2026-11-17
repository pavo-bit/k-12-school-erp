import {
  db,
  periods,
  rooms,
  timetableSlots,
  subjects,
  sections,
  staff,
  users,
  writeAudit,
} from "@school-erp/db";
import { eq, and, asc, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export class TimetableError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "TimetableError";
  }
}

// ── Periods ───────────────────────────────────────────────────────────────
export interface CreatePeriodInput {
  schoolId: string;
  name: string;
  startTime: string;
  endTime: string;
  order?: number;
  actorId: string;
}

export async function createPeriod(input: CreatePeriodInput) {
  const id = randomUUID();
  await db.insert(periods).values([
    {
      id,
      schoolId: input.schoolId,
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      order: input.order ?? 1,
    },
  ]);
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "period.created",
    entityType: "period",
    entityId: id,
    after: { name: input.name, order: input.order ?? 1 },
  });
  return { id, name: input.name };
}

export async function listPeriods(schoolId: string) {
  return db
    .select()
    .from(periods)
    .where(eq(periods.schoolId, schoolId))
    .orderBy(asc(periods.order));
}

// ── Rooms ─────────────────────────────────────────────────────────────────
export interface CreateRoomInput {
  schoolId: string;
  name: string;
  capacity?: number;
  building?: string;
  type?: string;
  actorId: string;
}

export async function createRoom(input: CreateRoomInput) {
  const id = randomUUID();
  await db.insert(rooms).values([
    {
      id,
      schoolId: input.schoolId,
      name: input.name,
      capacity: input.capacity ?? null,
      building: input.building ?? null,
      type: input.type ?? "classroom",
    },
  ]);
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "room.created",
    entityType: "room",
    entityId: id,
    after: { name: input.name, type: input.type ?? "classroom" },
  });
  return { id, name: input.name };
}

export async function listRooms(schoolId: string) {
  return db.select().from(rooms).where(eq(rooms.schoolId, schoolId)).orderBy(asc(rooms.name));
}

// ── Entries ───────────────────────────────────────────────────────────────
export interface SetEntryInput {
  schoolId: string;
  sectionId: string;
  dayOfWeek: number;
  periodId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string;
  room?: string;
  effectiveFrom: string;
  notes?: string;
  actorId: string;
}

async function existsInSchool(
  table: "sections" | "subjects" | "staff" | "periods" | "rooms",
  id: string,
  schoolId: string,
) {
  if (table === "sections") {
    const rows = await db
      .select({ id: sections.id })
      .from(sections)
      .where(and(eq(sections.id, id), eq(sections.schoolId, schoolId)))
      .limit(1);
    return rows.length > 0;
  }
  if (table === "subjects") {
    const rows = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)))
      .limit(1);
    return rows.length > 0;
  }
  if (table === "staff") {
    const rows = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, id), eq(staff.schoolId, schoolId)))
      .limit(1);
    return rows.length > 0;
  }
  if (table === "periods") {
    const rows = await db
      .select({ id: periods.id })
      .from(periods)
      .where(and(eq(periods.id, id), eq(periods.schoolId, schoolId)))
      .limit(1);
    return rows.length > 0;
  }
  const rows = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.id, id), eq(rooms.schoolId, schoolId)))
    .limit(1);
  return rows.length > 0;
}

export async function setEntry(input: SetEntryInput) {
  const checks: Array<[Parameters<typeof existsInSchool>[0], string, string]> = [
    ["sections", input.sectionId, "Section"],
    ["subjects", input.subjectId, "Subject"],
    ["staff", input.teacherId, "Teacher"],
    ["periods", input.periodId, "Period"],
  ];
  if (input.roomId) checks.push(["rooms", input.roomId, "Room"]);
  for (const [table, id, label] of checks) {
    if (!(await existsInSchool(table, id, input.schoolId))) {
      throw new TimetableError("REFERENCE_NOT_FOUND", `${label} not found in this school.`);
    }
  }

  // Conflict checks (also backed by unique constraints for race safety)
  const sectionBusy = await db
    .select({ id: timetableSlots.id })
    .from(timetableSlots)
    .where(
      and(
        eq(timetableSlots.schoolId, input.schoolId),
        eq(timetableSlots.sectionId, input.sectionId),
        eq(timetableSlots.dayOfWeek, input.dayOfWeek),
        eq(timetableSlots.periodId, input.periodId),
      ),
    )
    .limit(1);
  if (sectionBusy.length > 0) {
    throw new TimetableError(
      "SECTION_SLOT_TAKEN",
      "This section already has a class in that slot.",
    );
  }

  const teacherBusy = await db
    .select({ id: timetableSlots.id })
    .from(timetableSlots)
    .where(
      and(
        eq(timetableSlots.schoolId, input.schoolId),
        eq(timetableSlots.teacherId, input.teacherId),
        eq(timetableSlots.dayOfWeek, input.dayOfWeek),
        eq(timetableSlots.periodId, input.periodId),
      ),
    )
    .limit(1);
  if (teacherBusy.length > 0) {
    throw new TimetableError(
      "TEACHER_DOUBLE_BOOKED",
      "This teacher is already assigned in that slot.",
    );
  }

  if (input.roomId) {
    const roomBusy = await db
      .select({ id: timetableSlots.id })
      .from(timetableSlots)
      .where(
        and(
          eq(timetableSlots.schoolId, input.schoolId),
          eq(timetableSlots.roomId, input.roomId),
          eq(timetableSlots.dayOfWeek, input.dayOfWeek),
          eq(timetableSlots.periodId, input.periodId),
        ),
      )
      .limit(1);
    if (roomBusy.length > 0) {
      throw new TimetableError("ROOM_DOUBLE_BOOKED", "This room is already occupied in that slot.");
    }
  }

  const id = randomUUID();
  await db.insert(timetableSlots).values([
    {
      id,
      schoolId: input.schoolId,
      sectionId: input.sectionId,
      dayOfWeek: input.dayOfWeek,
      periodId: input.periodId,
      subjectId: input.subjectId,
      teacherId: input.teacherId,
      room: input.room ?? null,
      roomId: input.roomId ?? null,
      effectiveFrom: input.effectiveFrom,
    },
  ]);
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "timetable_entry.created",
    entityType: "timetable_slot",
    entityId: id,
    after: {
      sectionId: input.sectionId,
      dayOfWeek: input.dayOfWeek,
      periodId: input.periodId,
      subjectId: input.subjectId,
      teacherId: input.teacherId,
    },
  });
  return { id };
}

export interface EntryDto {
  id: string;
  sectionId: string;
  dayOfWeek: number;
  period: { id: string; name: string; startTime: string; endTime: string; order: number } | null;
  subject: { id: string; name: string; code: string | null } | null;
  teacher: { id: string; name: string; employeeCode: string } | null;
  room: { id: string | null; name: string | null } | null;
  effectiveFrom: string;
  notes: string | null;
}

export async function listEntries(input: {
  schoolId: string;
  sectionId?: string;
  teacherId?: string;
}) {
  if (!input.sectionId && !input.teacherId) {
    throw new TimetableError("MISSING_PARAM", "sectionId or teacherId is required.");
  }
  const conditions = [eq(timetableSlots.schoolId, input.schoolId)];
  if (input.sectionId) conditions.push(eq(timetableSlots.sectionId, input.sectionId));
  if (input.teacherId) conditions.push(eq(timetableSlots.teacherId, input.teacherId));

  const rows = await db
    .select()
    .from(timetableSlots)
    .where(and(...conditions))
    .orderBy(asc(timetableSlots.dayOfWeek));

  if (rows.length === 0) return [] as EntryDto[];

  const periodIds = [...new Set(rows.map((r) => r.periodId))];
  const subjectIds = [...new Set(rows.map((r) => r.subjectId))];
  const teacherIds = [...new Set(rows.map((r) => r.teacherId))];
  const roomIds = [...new Set(rows.map((r) => r.roomId).filter((v): v is string => !!v))];

  const [periodRows, subjectRows, staffRows] = await Promise.all([
    db.select().from(periods).where(inArray(periods.id, periodIds)),
    db.select().from(subjects).where(inArray(subjects.id, subjectIds)),
    db.select().from(staff).where(inArray(staff.id, teacherIds)),
  ]);
  const roomRows = roomIds.length
    ? await db.select().from(rooms).where(inArray(rooms.id, roomIds))
    : [];

  const userIds = staffRows.map((s) => s.userId).filter((v): v is string => !!v);
  const userRows = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];

  const periodById = new Map(periodRows.map((p) => [p.id, p]));
  const subjectById = new Map(subjectRows.map((s) => [s.id, s]));
  const staffById = new Map(staffRows.map((s) => [s.id, s]));
  const userById = new Map(userRows.map((u) => [u.id, u]));
  const roomById = new Map(roomRows.map((r) => [r.id, r]));

  const dtos: EntryDto[] = rows.map((r) => {
    const p = periodById.get(r.periodId) ?? null;
    const s = subjectById.get(r.subjectId) ?? null;
    const t = staffById.get(r.teacherId) ?? null;
    const u = t?.userId ? (userById.get(t.userId) ?? null) : null;
    const roomName = r.roomId ? (roomById.get(r.roomId)?.name ?? null) : r.room;
    return {
      id: r.id,
      sectionId: r.sectionId,
      dayOfWeek: r.dayOfWeek,
      period: p
        ? {
            id: p.id,
            name: p.name,
            startTime: String(p.startTime),
            endTime: String(p.endTime),
            order: p.order,
          }
        : null,
      subject: s ? { id: s.id, name: s.name, code: s.code } : null,
      teacher: t
        ? { id: t.id, name: u?.name ?? `Staff ${t.employeeCode}`, employeeCode: t.employeeCode }
        : null,
      room: r.roomId || r.room ? { id: r.roomId, name: roomName } : null,
      effectiveFrom: String(r.effectiveFrom),
      notes: null,
    };
  });

  return dtos.sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || (a.period?.order ?? 99) - (b.period?.order ?? 99),
  );
}

export async function deleteEntry(input: { schoolId: string; id: string; actorId: string }) {
  const rows = await db
    .select({ id: timetableSlots.id })
    .from(timetableSlots)
    .where(and(eq(timetableSlots.id, input.id), eq(timetableSlots.schoolId, input.schoolId)))
    .limit(1);
  if (rows.length === 0) {
    throw new TimetableError("NOT_FOUND", "Timetable entry not found.");
  }
  await db.delete(timetableSlots).where(eq(timetableSlots.id, input.id));
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "timetable_entry.deleted",
    entityType: "timetable_slot",
    entityId: input.id,
  });
  return { id: input.id, deleted: true };
}
