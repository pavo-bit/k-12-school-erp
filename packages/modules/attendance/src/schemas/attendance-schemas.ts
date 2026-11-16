import { z } from "zod";

// Class schemas
export const CreateClassSchema = z.object({
  schoolId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string().min(1).max(100),
  order: z.number().int().min(1).max(20),
});

export const ClassResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string(),
  order: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Section schemas
export const CreateSectionSchema = z.object({
  schoolId: z.string().uuid(),
  classId: z.string().uuid(),
  name: z.string().min(1).max(50),
  room: z.string().optional(),
  capacity: z.number().int().min(1).max(100).optional(),
});

export const SectionResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  classId: z.string().uuid(),
  name: z.string(),
  room: z.string().nullable(),
  capacity: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Subject schemas
export const CreateSubjectSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  type: z.enum(["theory", "practical", "both"]),
});

export const SubjectResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Teacher Assignment schemas
export const CreateTeacherAssignmentSchema = z.object({
  schoolId: z.string().uuid(),
  teacherId: z.string().uuid(),
  sectionId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicYearId: z.string().uuid(),
});

export const TeacherAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  teacherId: z.string().uuid(),
  sectionId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Holiday schemas
export const CreateHolidaySchema = z.object({
  schoolId: z.string().uuid(),
  date: z.string().datetime(),
  name: z.string().min(1).max(200),
  appliesTo: z.enum(["all", "weekdays", "weekends"]),
});

export const HolidayResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  date: z.date(),
  name: z.string(),
  appliesTo: z.string(),
  createdAt: z.date(),
});

// Period schemas
export const CreatePeriodSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(100),
  startTime: z.string().time(),
  endTime: z.string().time(),
  order: z.number().int().min(1).max(15),
});

export const PeriodResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  order: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Timetable schemas
export const CreateTimetableSlotSchema = z.object({
  schoolId: z.string().uuid(),
  sectionId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  periodId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  room: z.string().optional(),
  effectiveFrom: z.string().datetime(),
});

export const TimetableSlotResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  sectionId: z.string().uuid(),
  dayOfWeek: z.number(),
  periodId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  room: z.string().nullable(),
  effectiveFrom: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Attendance Session schemas
export const CreateAttendanceSessionSchema = z.object({
  schoolId: z.string().uuid(),
  sectionId: z.string().uuid(),
  date: z.string().datetime(),
  sessionType: z.enum(["morning", "afternoon", "full_day"]),
  status: z.enum(["draft", "submitted", "approved"]).default("draft"),
  submittedBy: z.string(),
});

export const AttendanceSessionResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  sectionId: z.string().uuid(),
  date: z.date(),
  sessionType: z.string(),
  status: z.string(),
  submittedBy: z.string().nullable(),
  submittedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Attendance Record schemas
export const MarkAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "excused"]),
  markedBy: z.string(),
  markedAt: z.string().datetime(),
});

export const AttendanceRecordResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.string(),
  markedBy: z.string(),
  markedAt: z.date(),
  source: z.string().optional(),
});

// Attendance Correction schemas
export const CreateAttendanceCorrectionSchema = z.object({
  schoolId: z.string().uuid(),
  attendanceRecordId: z.string().uuid(),
  oldStatus: z.string(),
  newStatus: z.string(),
  reason: z.string().min(1).max(500),
  actorId: z.string(),
  approvedBy: z.string(),
});

export const AttendanceCorrectionResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  attendanceRecordId: z.string().uuid(),
  oldStatus: z.string(),
  newStatus: z.string(),
  reason: z.string(),
  actorId: z.string(),
  approvedBy: z.string(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Staff Attendance schemas
export const CreateStaffAttendanceSchema = z.object({
  schoolId: z.string().uuid(),
  staffId: z.string().uuid(),
  date: z.string().datetime(),
  status: z.enum(["present", "absent", "late", "on_leave"]),
  source: z.string().optional(),
});

export const StaffAttendanceResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  staffId: z.string().uuid(),
  date: z.date(),
  status: z.string(),
  source: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Sync Operation schemas
export const CreateSyncOperationSchema = z.object({
  schoolId: z.string().uuid(),
  deviceId: z.string(),
  operationId: z.string(),
  status: z.enum(["pending", "success", "failed"]),
  result: z.any().optional(),
});

export const SyncOperationResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  deviceId: z.string(),
  operationId: z.string(),
  status: z.string(),
  result: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
