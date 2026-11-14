import { db, attendanceSessions, attendanceRecords } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
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
  await db.insert(attendanceSessions).values({
    id,
    schoolId: input.schoolId,
    sectionId: input.sectionId,
    date: input.date,
    sessionType: input.sessionType,
    status: "draft",
    submittedBy: input.submittedBy,
  });
  return { id, status: "draft" };
}

export interface MarkAttendanceInput {
  schoolId: string;
  sessionId: string;
  records: { studentId: string; status: string }[];
  actorId: string;
}

export async function markAttendance(input: MarkAttendanceInput) {
  for (const r of input.records) {
    await db
      .insert(attendanceRecords)
      .values({
        id: randomUUID(),
        schoolId: input.schoolId,
        sessionId: input.sessionId,
        studentId: r.studentId,
        status: r.status,
        markedBy: input.actorId,
        markedAt: new Date(),
        source: "web",
      })
      .onConflictDoUpdate({
        target: [attendanceRecords.sessionId, attendanceRecords.studentId],
        set: {
          status: r.status,
          markedBy: input.actorId,
          markedAt: new Date(),
          updatedAt: new Date(),
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

export async function listSessions(schoolId: string, sectionId?: string, date?: string) {
  if (sectionId && date) {
    return db
      .select()
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.schoolId, schoolId),
          eq(attendanceSessions.sectionId, sectionId),
          eq(attendanceSessions.date, date),
        ),
      );
  }
  return db.select().from(attendanceSessions).where(eq(attendanceSessions.schoolId, schoolId));
}
