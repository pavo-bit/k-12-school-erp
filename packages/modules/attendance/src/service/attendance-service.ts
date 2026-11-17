import {
  db,
  attendanceSessions,
  attendanceRecords,
  staffAttendance,
  syncOperations,
  holidays,
} from "@school-erp/db";
import { eq, and, desc } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

export interface CreateSessionInput {
  schoolId: string;
  sectionId: string;
  date: string;
  sessionType: string;
  submittedBy: string;
  actorId: string;
}

export async function createSession(input: CreateSessionInput) {
  const id = randomUUID();
  await db.insert(attendanceSessions).values([
    {
      id,
      schoolId: input.schoolId,
      sectionId: input.sectionId,
      date: input.date,
      sessionType: input.sessionType,
      status: "draft",
      submittedBy: input.submittedBy,
    },
  ]);
  return { id, status: "draft" };
}

export async function listAttendanceSessions(schoolId: string, sectionId?: string, date?: string) {
  const conditions = [eq(attendanceSessions.schoolId, schoolId)];
  if (sectionId) conditions.push(eq(attendanceSessions.sectionId, sectionId));
  if (date) conditions.push(eq(attendanceSessions.date, date));
  return db
    .select()
    .from(attendanceSessions)
    .where(and(...conditions))
    .orderBy(attendanceSessions.date);
}

export interface MarkAttendanceInput {
  schoolId: string;
  sessionId: string;
  records: { studentId: string; status: string }[];
  actorId: string;
  /** Channel that recorded the marks — "web" (default) or "mobile". */
  source?: "web" | "mobile";
}

export async function markAttendance(input: MarkAttendanceInput) {
  for (const r of input.records) {
    await db
      .insert(attendanceRecords)
      .values([
        {
          id: randomUUID(),
          schoolId: input.schoolId,
          sessionId: input.sessionId,
          studentId: r.studentId,
          status: r.status,
          markedBy: input.actorId,
          markedAt: new Date(),
          source: input.source ?? "web",
        },
      ])
      .onConflictDoUpdate({
        target: [attendanceRecords.sessionId, attendanceRecords.studentId],
        set: {
          status: r.status,
          markedBy: input.actorId,
          markedAt: new Date(),
          updatedAt: new Date(),
          source: input.source ?? "web",
        },
      });
  }
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "attendance.marked",
    entityType: "attendance_session",
    entityId: input.sessionId,
    after: { count: input.records.length },
  });
  return { sessionId: input.sessionId, count: input.records.length };
}

export async function submitSession(schoolId: string, sessionId: string, actorId: string) {
  await db
    .update(attendanceSessions)
    .set({ status: "submitted", updatedAt: new Date() })
    .where(eq(attendanceSessions.id, sessionId));
  await writeAudit({
    scope: "school",
    schoolId,
    actorId,
    action: "attendance.submitted",
    entityType: "attendance_session",
    entityId: sessionId,
  });
  return { sessionId, status: "submitted" };
}

export async function getSessionRecords(schoolId: string, sessionId: string) {
  return db.select().from(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));
}

export async function createStaffAttendance(
  schoolId: string,
  staffId: string,
  date: string,
  status: string,
  source: "web" | "mobile" = "web",
) {
  const id = randomUUID();
  await db.insert(staffAttendance).values([
    {
      id,
      schoolId,
      staffId,
      date,
      status,
      source,
    },
  ]);
  return { id, staffId, date, status };
}

export async function listStaffAttendance(schoolId: string, staffId?: string, date?: string) {
  const conditions = [eq(staffAttendance.schoolId, schoolId)];
  if (staffId) conditions.push(eq(staffAttendance.staffId, staffId));
  if (date) conditions.push(eq(staffAttendance.date, date));
  return db
    .select()
    .from(staffAttendance)
    .where(and(...conditions))
    .orderBy(staffAttendance.date);
}

export async function getSyncOperation(deviceId: string, operationId: string) {
  const rows = await db
    .select()
    .from(syncOperations)
    .where(and(eq(syncOperations.deviceId, deviceId), eq(syncOperations.operationId, operationId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSyncOperation(schoolId: string, deviceId: string, operationId: string) {
  const id = randomUUID();
  await db.insert(syncOperations).values([
    {
      id,
      schoolId,
      deviceId,
      operationId,
      status: "pending",
    },
  ]);
  return { id, operationId, status: "pending" };
}

export async function updateSyncOperation(id: string, status: string, result?: string) {
  await db
    .update(syncOperations)
    .set({ status, result: result ?? null, updatedAt: new Date() })
    .where(eq(syncOperations.id, id));
  return { id, status };
}
