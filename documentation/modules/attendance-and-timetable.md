# Attendance and Timetable

**Prefixes:** `FR-ATT`  
**Release:** Beta; enhancements at GA  
**Owner:** Product / Academics

---

## 1. Purpose

Give teachers a fast, reliable way to record daily attendance, give administrators accurate registers, and give parents timely absence information. Provide a simple timetable that supports daily operations without a full scheduling engine.

## 2. Actors and Permissions

| Actor                    | Permissions                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| Teacher / class teacher  | Mark and edit attendance for assigned sections on the current day  |
| School admin / principal | View all attendance, correct records with audit, configure cutoffs |
| Front desk               | View attendance; no edits by default                               |
| Parent                   | View own child’s attendance                                        |
| Accountant               | View attendance percentage where relevant to fees; no edits        |

## 3. Release Scope

**Beta**

- Daily attendance per class/section
- Statuses: present, absent, late, half-day, excused
- Teacher app offline attendance
- Admin corrections with audit
- Holidays and non-working days
- Absence alerts after a configurable cutoff
- Monthly register and percentage reports
- Basic timetable grid per section
- Teacher “today’s classes” view

**GA**

- Period-wise attendance (optional per school)
- Attendance import from biometric/RFID devices (adapter, not bundled hardware)
- Substitutions
- Staff attendance integration with payroll
- Advanced defaulter reports

**Post-GA**

- Auto timetable generation with constraints
- GPS/geofence staff attendance
- Biometric device management

## 4. Functional Requirements

### Attendance

- **FR-ATT-001 (MUST):** Create an attendance session per section per date and session type (full day, morning, afternoon).
- **FR-ATT-002 (MUST):** Mark each active student as present, absent, late, half-day, or excused.
- **FR-ATT-003 (MUST):** Default all students to present, with one-tap marking of absentees.
- **FR-ATT-004 (MUST):** Save attendance as a draft before final submission.
- **FR-ATT-005 (MUST):** Final submission locks the teacher’s edit window; admin corrections require a reason and audit.
- **FR-ATT-006 (MUST):** Teacher app works offline and syncs idempotently.
- **FR-ATT-007 (MUST):** Server rejects duplicate records for the same student, session, and date.
- **FR-ATT-008 (MUST):** Attendance can be marked only for students with an active enrollment in the section.
- **FR-ATT-009 (MUST):** Holidays and non-working days block attendance marking.
- **FR-ATT-010 (MUST):** Absence alerts are sent after the school-configured cutoff, not at submission time.
- **FR-ATT-011 (MUST):** Parents see attendance by date and a monthly percentage.
- **FR-ATT-012 (MUST):** Monthly register export exists for each section.
- **FR-ATT-013 (SHOULD):** Bulk mark all present/absent.
- **FR-ATT-014 (SHOULD):** Late arrivals can be converted to half-day based on school rules.
- **FR-ATT-015 (SHOULD):** Attendance percentage appears on report cards.

### Timetable

- **FR-ATT-020 (MUST):** Configure periods per school: name, start time, end time, order.
- **FR-ATT-021 (MUST):** Configure a weekly timetable grid per section: day, period, subject, teacher, room.
- **FR-ATT-022 (MUST):** Warn on teacher double-booking and room conflicts; allow override with reason for admins.
- **FR-ATT-023 (MUST):** Teacher app shows today’s classes based on the timetable.
- **FR-ATT-024 (MUST):** Timetable can be imported from CSV at onboarding.
- **FR-ATT-025 (SHOULD):** Effective dates for timetable changes.
- **FR-ATT-026 (SHOULD):** Substitution assignment at GA.

## 5. Business Rules

1. Attendance is scoped to academic year, section, date, and session.
2. A student can have only one attendance record per session.
3. Attendance cannot be marked for a future date.
4. Admin corrections within 7 days require a reason; older corrections require principal approval.
5. Absence alerts are sent once per student per session; duplicates are suppressed.
6. A student marked excused with an approved leave should not receive an absence alert.
7. A teacher can mark attendance only for sections assigned to them, unless they have a school-wide permission.
8. Offline records carry a client-generated operation ID; the server must be idempotent.
9. Conflict rule: last-write-wins for the same teacher and session; otherwise the server returns a conflict for admin resolution.
10. Timetable conflicts are warnings for admins and hard blocks for teachers.

## 6. Key Data

`attendance_sessions`, `attendance_records`, `attendance_corrections`, `holidays`, `leave_requests`, `staff_attendance`, `periods`, `timetable_slots`, `substitutions`, `sync_operations`.

## 7. APIs and Events

**APIs**

- `GET /api/v1/attendance/sessions?section_id=&date=`
- `POST /api/v1/attendance/sessions`
- `PUT /api/v1/attendance/sessions/{id}/records`
- `POST /api/v1/attendance/sessions/{id}/submit`
- `POST /api/v1/attendance/corrections`
- `GET /api/v1/attendance/reports/monthly`
- `POST /api/v1/mobile/sync/attendance`
- `GET /api/v1/timetable?section_id=`
- `PUT /api/v1/timetable/slots`

**Events**

- `attendance.submitted`
- `attendance.corrected`
- `attendance.absent`
- `attendance.sync_conflict`
- `timetable.published`

## 8. Imports and Exports

- Timetable CSV import: section, day, period, subject, teacher, room.
- Attendance register export: CSV/XLSX/PDF.
- Absence report export.
- Defaulter report (below threshold percentage).

## 9. Edge Cases

- Teacher loses connectivity mid-marking
- Duplicate sync after timeout
- Student transferred after attendance marked
- Admin edits while teacher is offline
- Holiday declared after attendance was marked
- School-wide event changes the timetable
- Teacher assigned to two sections in the same period
- Student joins mid-year with no historical attendance

## 10. Acceptance Criteria

- **Given** a teacher with an assigned section, **when** they mark 40 students and submit, **then** the session is locked and the register updates in under 2 seconds.
- **Given** no network, **when** the teacher marks attendance, **then** records are stored locally and show pending sync.
- **Given** a duplicate sync, **when** the server processes it, **then** no duplicate attendance records are created.
- **Given** an admin correction, **when** saved with a reason, **then** the original value, new value, reason, and actor are audited.
- **Given** an absence, **when** the cutoff time passes, **then** the parent receives exactly one alert per session.
- **Given** a teacher double-booked in the timetable, **when** an admin saves the slot, **then** a conflict warning is shown and the override is audited.

## 11. Metrics and Audit Events

**Metrics**

- Attendance submission rate by section
- Median marking time
- Offline sync success rate
- Conflict rate
- Absence alert delivery rate
- Attendance percentage by class

**Audit events**

- Attendance submitted
- Attendance corrected
- Holiday created/changed
- Timetable published
- Substitution assigned
- Offline conflict resolved

## 12. Open Questions

- Is period-wise attendance required for any pilot school?
- What is the default absence-alert cutoff time?
- Should late marks affect report-card attendance percentage?
- Are staff and student attendance separate modules or one shared model?
