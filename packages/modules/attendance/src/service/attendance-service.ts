import { db, classes, sections, subjects, teacher_assignments, holidays, periods, timetable_slots, attendance_sessions, attendance_records, attendance_corrections, staff_attendance, sync_operations } from "@school-erp/db";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Class operations
export interface CreateClassInput {
  schoolId: string;
  academicYearId: string;
  name: string;
  order: number;
}

export async function createClass(input: CreateClassInput) {
  const id = randomUUID();
  await db.insert(classes).values({
    id,
    schoolId: input.schoolId,
    academicYearId: input.academicYearId,
    name: input.name,
    order: input.order,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: null,
    action: "class.created",
    entityType: "class",
    entityId: id,
    after: { name: input.name, order: input.order },
  });

  return { id, name: input.name, order: input.order };
}

export async function getClass(id: string) {
  const rows = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listClasses(schoolId: string, academicYearId?: string) {
  const query = db.select().from(classes).where(eq(classes.schoolId, schoolId));
  if (academicYearId) {
    query.where(eq(classes.academicYearId, academicYearId));
  }
  return query.orderBy(classes.order);
}

// Section operations
export interface CreateSectionInput {
  schoolId: string;
  classId: string;
  name: string;
  room?: string;
  capacity?: number;
}

export async function createSection(input: CreateSectionInput) {
  const id = randomUUID();
  await db.insert(sections).values({
    id,
    schoolId: input.schoolId,
    classId: input.classId,
    name: input.name,
    room: input.room ?? null,
    capacity: input.capacity ?? null,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: null,
    action: "section.created",
    entityType: "section",
    entityId: id,
    after: { name: input.name, classId: input.classId },
  });

  return { id, name: input.name, classId: input.classId };
}

export async function getSection(id: string) {
  const rows = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listSections(schoolId: string, classId?: string) {
  const query = db.select().from(sections).where(eq(sections.schoolId, schoolId));
  if (classId) {
    query.where(eq(sections.classId, classId));
  }
  return query.orderBy(sections.name);
}

// Subject operations
export interface CreateSubjectInput {
  schoolId: string;
  name: string;
  code: string;
  type: string;
}

export async function createSubject(input: CreateSubjectInput) {
  const id = randomUUID();
  await db.insert(subjects).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    code: input.code,
    type: input.type,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: null,
    action: "subject.created",
    entityType: "subject",
    entityId: id,
    after: { name: input.name, code: input.code },
  });

  return { id, name: input.name, code: input.code };
}

export async function getSubject(id: string) {
  const rows = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listSubjects(schoolId: string) {
  return db.select().from(subjects).where(eq(subjects.schoolId, schoolId)).orderBy(subjects.name);
}

// Teacher Assignment operations
export interface CreateTeacherAssignmentInput {
  schoolId: string;
  teacherId: string;
  sectionId: string;
  subjectId: string;
  academicYearId: string;
}

export async function createTeacherAssignment(input: CreateTeacherAssignmentInput) {
  const id = randomUUID();
  await db.insert(teacher_assignments).values({
    id,
    schoolId: input.schoolId,
    teacherId: input.teacherId,
    sectionId: input.sectionId,
    subjectId: input.subjectId,
    academicYearId: input.academicYearId,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: null,
    action: "teacher_assignment.created",
    entityType: "teacher_assignment",
    entityId: id,
    after: { teacherId: input.teacherId, sectionId: input.sectionId, subjectId: input.subjectId },
  });

  return { id, teacherId: input.teacherId, sectionId: input.sectionId, subjectId: input.subjectId };
}

// Holiday operations
export interface CreateHolidayInput {
  schoolId: string;
  date: Date;
  name: string;
  appliesTo: string;
}

export async function createHoliday(input: CreateHolidayInput) {
  const id = randomUUID();
  await db.insert(holidays).values({
    id,
    schoolId: input.schoolId,
    date: input.date,
    name: input.name,
    appliesTo: input.appliesTo,
  });

  return { id, date: input.date, name: input.name, appliesTo: input.appliesTo };
}

export async function listHolidays(schoolId: string, startDate?: Date, endDate?: Date) {
  const query = db.select().from(holidays).where(eq(holidays.schoolId, schoolId));

  if (startDate && endDate) {
    query.where(sql`${holidays.date} >= ${startDate} AND ${holidays.date} <= ${endDate}`);
  } else if (startDate) {
    query.where(sql`${holidays.date} >= ${startDate}`);
  } else if (endDate) {
    query.where(sql`${holidays.date} <= ${endDate}`);
  }

  return query.orderBy(holidays.date);
}

// Period operations
export interface CreatePeriodInput {
  schoolId: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
}

export async function createPeriod(input: CreatePeriodInput) {
  const id = randomUUID();
  await db.insert(periods).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    startTime: input.startTime,
    endTime: input.endTime,
    order: input.order,
  });

  return { id, name: input.name, startTime: input.startTime, endTime: input.endTime, order: input.order };
}

export async function listPeriods(schoolId: string) {
  return db.select().from(periods).where(eq(periods.schoolId, schoolId)).orderBy(periods.order);
}

// Timetable Slot operations
export interface CreateTimetableSlotInput {
  schoolId: string;
  sectionId: string;
  dayOfWeek: number;
  periodId: string;
  subjectId: string;
  teacherId: string;
  room?: string;
  effectiveFrom: Date;
}

export async function createTimetableSlot(input: CreateTimetableSlotInput) {
  const id = randomUUID();
  await db.insert(timetable_slots).values({
    id,
    schoolId: input.schoolId,
    sectionId: input.sectionId,
    dayOfWeek: input.dayOfWeek,
    periodId: input.periodId,
    subjectId: input.subjectId,
    teacherId: input.teacherId,
    room: input.room ?? null,
    effectiveFrom: input.effectiveFrom,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: null,
    action: "timetable_slot.created",
    entityType: "timetable_slot",
    entityId: id,
    after: { sectionId: input.sectionId, dayOfWeek: input.dayOfWeek, periodId: input.periodId },
  });

  return { id, sectionId: input.sectionId, dayOfWeek: input.dayOfWeek, periodId: input.periodId };
}

export async function getTimetableSlot(id: string) {
  const rows = await db.select().from(timetable_slots).where(eq(timetable_slots.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listTimetableSlots(schoolId: string, sectionId?: string) {
  const query = db.select().from(timetable_slots).where(eq(timetable_slots.schoolId, schoolId));
  if (sectionId) {
    query.where(eq(timetable_slots.sectionId, sectionId));
  }
  return query.orderBy(timetable_slots.dayOfWeek, timetable_slots.periodId);
}

// Attendance Session operations
export interface CreateAttendanceSessionInput {
  schoolId: string;
  sectionId: string;
  date: Date;
  sessionType: string;
  status: string;
  submittedBy: string;
}

export async function createAttendanceSession(input: CreateAttendanceSessionInput) {
  const id = randomUUID();
  await db.insert(attendance_sessions).values({
    id,
    schoolId: input.schoolId,
    sectionId: input.sectionId,
    date: input.date,
    sessionType: input.sessionType,
    status: input.status,
    submittedBy: input.submittedBy,
    submittedAt: input.status === "submitted" ? new Date() : null,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.submittedBy,
    action: "attendance_session.created",
    entityType: "attendance_session",
    entityId: id,
    after: { sectionId: input.sectionId, date: input.date, sessionType: input.sessionType, status: input.status },
  });

  return { id, sectionId: input.sectionId, date: input.date, sessionType: input.sessionType, status: input.status };
}

export async function getAttendanceSession(id: string) {
  const rows = await db.select().from(attendance_sessions).where(eq(attendance_sessions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listAttendanceSessions(schoolId: string, sectionId?: string, date?: Date) {
  const query = db.select().from(attendance_sessions).where(eq(attendance_sessions.schoolId, schoolId));
  if (sectionId) {
    query.where(eq(attendance_sessions.sectionId, sectionId));
  }
  if (date) {
    query.where(sql`${attendance_sessions.date} = ${date}`);
  }
  return query.orderBy(attendance_sessions.date);
}

// Attendance Record operations
export interface MarkAttendanceInput {
  sessionId: string;
  studentId: string;
  status: string;
  markedBy: string;
  markedAt?: Date;
}

export async function markAttendance(input: MarkAttendanceInput) {
  const markedAt = input.markedAt ?? new Date();
  const id = randomUUID();

  await db.insert(attendance_records).values({
    id,
    sessionId: input.sessionId,
    studentId: input.studentId,
    status: input.status,
    markedBy: input.markedBy,
    markedAt,
    source: "web",
  });

  await writeAudit({
    scope: "school",
    schoolId: null, // Will be set from session
    actorId: input.markedBy,
    action: "attendance_record.created",
    entityType: "attendance_record",
    entityId: id,
    after: { sessionId: input.sessionId, studentId: input.studentId, status: input.status },
  });

  return { id, sessionId: input.sessionId, studentId: input.studentId, status: input.status };
}

export async function getAttendanceRecord(id: string) {
  const rows = await db.select().from(attendance_records).where(eq(attendance_records.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listAttendanceRecords(sessionId: string) {
  return db.select().from(attendance_records).where(eq(attendance_records.sessionId, sessionId));
}

// Attendance Correction operations
export interface CreateAttendanceCorrectionInput {
  schoolId: string;
  attendanceRecordId: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  actorId: string;
  approvedBy: string;
}

export async function createAttendanceCorrection(input: CreateAttendanceCorrectionInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(attendance_corrections).values({
    id,
    schoolId: input.schoolId,
    attendanceRecordId: input.attendanceRecordId,
    oldStatus: input.oldStatus,
    newStatus: input.newStatus,
    reason: input.reason,
    actorId: input.actorId,
    approvedBy: input.approvedBy,
    approvedAt: now,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.approvedBy,
    action: "attendance_correction.created",
    entityType: "attendance_correction",
    entityId: id,
    after: { attendanceRecordId: input.attendanceRecordId, oldStatus: input.oldStatus, newStatus: input.newStatus },
  });

  return { id, attendanceRecordId: input.attendanceRecordId, oldStatus: input.oldStatus, newStatus: input.newStatus };
}

// Staff Attendance operations
export interface CreateStaffAttendanceInput {
  schoolId: string;
  staffId: string;
  date: Date;
  status: string;
  source?: string;
}

export async function createStaffAttendance(input: CreateStaffAttendanceInput) {
  const id = randomUUID();
  await db.insert(staff_attendance).values({
    id,
    schoolId: input.schoolId,
    staffId: input.staffId,
    date: input.date,
    status: input.status,
    source: input.source ?? "web",
  });

  return { id, staffId: input.staffId, date: input.date, status: input.status };
}

export async function listStaffAttendance(schoolId: string, staffId?: string, date?: Date) {
  const query = db.select().from(staff_attendance).where(eq(staff_attendance.schoolId, schoolId));
  if (staffId) {
    query.where(eq(staff_attendance.staffId, staffId));
  }
  if (date) {
    query.where(sql`${staff_attendance.date} = ${date}`);
  }
  return query.orderBy(staff_attendance.date);
}

// Sync Operation operations
export interface CreateSyncOperationInput {
  schoolId: string;
  deviceId: string;
  operationId: string;
  status: string;
  result?: any;
}

export async function createSyncOperation(input: CreateSyncOperationInput) {
  const id = randomUUID();
  await db.insert(sync_operations).values({
    id,
    schoolId: input.schoolId,
    deviceId: input.deviceId,
    operationId: input.operationId,
    status: input.status,
    result: input.result ?? null,
  });

  return { id, deviceId: input.deviceId, operationId: input.operationId, status: input.status };
}

export async function getSyncOperation(deviceId: string, operationId: string) {
  const rows = await db
    .select()
    .from(sync_operations)
    .where(eq(sync_operations.deviceId, deviceId), eq(sync_operations.operationId, operationId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listSyncOperations(schoolId: string, deviceId?: string) {
  const query = db.select().from(sync_operations).where(eq(sync_operations.schoolId, schoolId));
  if (deviceId) {
    query.where(eq(sync_operations.deviceId, deviceId));
  }
  return query.orderBy(desc(sync_operations.createdAt));
}
