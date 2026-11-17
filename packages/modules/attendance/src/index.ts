export {
  createSession,
  listAttendanceSessions,
  markAttendance,
  submitSession,
  getSessionRecords,
  createStaffAttendance,
  listStaffAttendance,
  getSyncOperation,
  createSyncOperation,
  updateSyncOperation,
} from "./service/attendance-service";
export type { CreateSessionInput, MarkAttendanceInput } from "./service/attendance-service";
