# Teacher App

**Prefix:** `FR-TAPP`  
**Release:** Beta; marks entry at GA  
**Owner:** Product / Mobile

---

## 1. Purpose

Give teachers a fast, dependable mobile surface for daily work: today’s classes, offline attendance, marks entry, leave, payslips, and school announcements. The app must work on mid-range Android phones and unreliable school networks.

## 2. Actors and Permissions

| Actor             | Permissions                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| Teacher           | Assigned sections and subjects; own profile, leave, payslips               |
| Class teacher     | Section roster, attendance, consolidated section view                      |
| Exam coordinator  | Marks configuration and oversight on web; mobile marks entry if assigned   |
| Principal / admin | No default teacher-app access beyond their own staff role                  |
| Platform admin    | Release configuration only; no teacher data without audited support access |

## 3. Release Scope

**Beta**

- Staff login with phone OTP or school-issued credentials
- Today’s classes and assigned sections
- Offline daily attendance with encrypted local storage
- Sync status, retry, and conflict display
- Student roster with basic profile and guardian contact where permitted
- Announcements
- Leave request and balance
- Payslip list and PDF download
- Own profile and device management
- Push notifications

**GA**

- Marks entry for assigned exam-subject-sections
- Attendance history and corrections view
- Timetable week view
- Result publication status
- In-app help and support

**Post-GA**

- Homework and lesson plans
- PTM scheduling
- Class analytics
- Offline marks entry (not planned for GA due to conflict and integrity risk)

## 4. Functional Requirements

### Authentication and session

- **FR-TAPP-001 (MUST):** Teacher signs in with a school-issued account using phone OTP or invited email/password, per school policy.
- **FR-TAPP-002 (MUST):** Access tokens are short-lived and refresh tokens rotate and are stored in the OS secure store.
- **FR-TAPP-003 (MUST):** Logout and remote revocation clear local encrypted data.
- **FR-TAPP-004 (MUST):** The app supports a 4-digit app PIN or biometric unlock after initial login.
- **FR-TAPP-005 (MUST):** The app blocks access when the teacher account is deactivated or the device is revoked.
- **FR-TAPP-006 (SHOULD):** The app lists active devices and allows revocation.

### Today and roster

- **FR-TAPP-010 (MUST):** Home shows today’s assigned classes and sections in timetable order.
- **FR-TAPP-011 (MUST):** If no timetable exists, the app falls back to assigned sections with a clear label.
- **FR-TAPP-012 (MUST):** Teacher sees the active student roster for assigned sections.
- **FR-TAPP-013 (MUST):** Roster includes student name, roll number, photo where available, and attendance status.
- **FR-TAPP-014 (MUST):** Teacher can search within a roster.
- **FR-TAPP-015 (SHOULD):** Teacher can call the primary guardian from the student detail screen, with role permission and audit.
- **FR-TAPP-016 (SHOULD):** Teacher sees a section attendance summary for the month.

### Offline attendance

- **FR-TAPP-020 (MUST):** Teacher can open today’s class and mark attendance without network connectivity if the roster was previously synced.
- **FR-TAPP-021 (MUST):** Attendance is stored in a SQLCipher-encrypted local database.
- **FR-TAPP-022 (MUST):** Each attendance operation carries a client-generated operation ID for idempotency.
- **FR-TAPP-023 (MUST):** The app displays pending, syncing, synced, and failed states per record.
- **FR-TAPP-024 (MUST):** Sync retries automatically with backoff and supports manual retry.
- **FR-TAPP-025 (MUST):** Server conflicts are shown to the teacher with the server value and the local value.
- **FR-TAPP-026 (MUST):** Teacher may edit attendance until the school’s submission cutoff; after cutoff, corrections go through an admin request.
- **FR-TAPP-027 (MUST):** Local attendance data is purged after successful sync and retention of the configured grace period.
- **FR-TAPP-028 (MUST):** Marking a class of 40 students takes under 60 seconds on a mid-range device.
- **FR-TAPP-029 (MUST):** The app warns before logout or account switch if unsynced attendance exists.
- **FR-TAPP-030 (SHOULD):** The app supports marking all present and toggling absentees with a single tap.
- **FR-TAPP-031 (SHOULD):** The app shows the last successful roster sync time.

### Marks entry (GA)

- **FR-TAPP-040 (MUST):** Teacher sees only assigned exam-subject-section combinations.
- **FR-TAPP-041 (MUST):** Marks entry requires connectivity and server validation; no offline marks.
- **FR-TAPP-042 (MUST):** Marks validate against max/pass marks and allow absent, exempt, and not-applicable states.
- **FR-TAPP-043 (MUST):** Drafts save to the server; submission locks the teacher’s entry.
- **FR-TAPP-044 (MUST):** The app warns before submitting incomplete mandatory marks.
- **FR-TAPP-045 (SHOULD):** Teacher can view previously submitted marks and correction status.
- **FR-TAPP-046 (SHOULD):** Numeric keypad and next-student flow reduce entry time.

### Leave, payslips, and announcements

- **FR-TAPP-050 (MUST):** Teacher can view leave balances and request leave.
- **FR-TAPP-051 (MUST):** Teacher can view and download their own payslips.
- **FR-TAPP-052 (MUST):** Teacher sees announcements targeted to all staff or their role.
- **FR-TAPP-053 (MUST):** Teacher can view and edit limited profile fields; sensitive changes require HR approval.
- **FR-TAPP-054 (SHOULD):** Teacher receives push notifications for leave approval, payslip availability, and announcements.
- **FR-TAPP-055 (SHOULD):** Teacher can submit a support request with app diagnostics.

## 5. Business Rules

1. A teacher can act only on sections and subjects assigned in the active academic year.
2. Offline attendance is limited to today and yesterday; older dates require admin correction.
3. Attendance marked offline is provisional until the server accepts it.
4. The server is authoritative for conflicts and cutoffs.
5. Local data is encrypted at rest and cleared on logout, revocation, or app data reset.
6. Marks are never stored as authoritative data on the device; only drafts may be cached.
7. Payslip PDFs are downloaded on demand and cached encrypted with an expiry.
8. Guardian phone numbers are shown only if the school permits teacher access.
9. The app must not display salary data for other staff.
10. Device time manipulation must not create future-dated attendance; the server validates against its clock.
11. The app supports Android 9 and above at launch; iOS follows post-GA.
12. Minimum supported app version is enforced server-side.

## 6. Key Data

Server-side: `staff`, `teacher_assignments`, `timetable_slots`, `sections`, `students`, `enrollments`, `attendance_sessions`, `attendance_records`, `exam_subjects`, `marks`, `leave_balances`, `leave_requests`, `payslips`, `announcements`, `device_tokens`, `sync_operations`.

Local device: encrypted roster cache, today’s sessions, attendance outbox, profile, settings, and cached payslip metadata.

## 7. APIs and Events

**APIs**

- `POST /api/v1/mobile/auth/otp/request`
- `POST /api/v1/mobile/auth/otp/verify`
- `POST /api/v1/mobile/auth/refresh`
- `GET /api/v1/mobile/teacher/today`
- `GET /api/v1/mobile/teacher/sections/{id}/roster`
- `POST /api/v1/mobile/sync/attendance`
- `GET /api/v1/mobile/sync/attendance/{operation_id}`
- `GET /api/v1/mobile/teacher/attendance/history`
- `GET /api/v1/mobile/teacher/exams`
- `PUT /api/v1/mobile/teacher/exams/{id}/marks`
- `POST /api/v1/mobile/teacher/exams/{id}/marks/submit`
- `GET /api/v1/mobile/teacher/leave`
- `POST /api/v1/mobile/teacher/leave`
- `GET /api/v1/mobile/teacher/payslips`
- `GET /api/v1/mobile/announcements`
- `POST /api/v1/mobile/devices`

**Events consumed as push**

- `attendance.sync_conflict`
- `leave.approved`
- `leave.rejected`
- `payslip.available`
- `announcement.sent`
- `marks.reopened`

## 8. Offline Sync Contract

The app sends a batch:

```json
{
  "device_id": "uuid",
  "operations": [
    {
      "operation_id": "client-uuid",
      "type": "attendance.submit",
      "section_id": "uuid",
      "date": "2027-06-14",
      "session": "full_day",
      "records": [
        { "student_id": "uuid", "status": "present" },
        { "student_id": "uuid", "status": "absent" }
      ],
      "client_recorded_at": "2027-06-14T09:12:31+05:30"
    }
  ]
}
```

Response returns per-operation status (`applied`, `duplicate`, `conflict`, `rejected`) with reasons. The client updates local state from the response and never assumes success before it.

## 9. Edge Cases

- App killed during marking
- Network drops mid-sync
- Duplicate sync after timeout
- Teacher assignment changed mid-day
- Student transferred after roster sync
- Admin edits attendance while teacher is offline
- Holiday declared after offline marking
- Device clock changed
- Device lost or stolen
- App updated while unsynced records exist
- Token expired after long offline period
- Storage full during encryption
- Teacher assigned to two sections in the same period
- Exam reopened after teacher submitted marks

## 10. Acceptance Criteria

- **Given** a synced roster and no network, **when** the teacher marks 40 students, **then** records save locally and show pending sync in under 60 seconds.
- **Given** pending records, **when** connectivity returns, **then** the app syncs automatically and marks records synced.
- **Given** a duplicate sync request, **when** processed, **then** the server returns `duplicate` and no duplicate attendance is stored.
- **Given** an admin correction made while the teacher was offline, **when** the teacher syncs, **then** the conflict is shown with both values and resolution options.
- **Given** a teacher not assigned to a section, **when** they request the roster, **then** the API returns 403.
- **Given** unsynced attendance, **when** the teacher logs out, **then** the app warns and requires confirmation.
- **Given** marks entry, **when** the teacher loses network, **then** submission fails with a clear retry option and no offline marks are stored as final.
- **Given** a payslip, **when** opened by another staff member, **then** access is denied.

## 11. Metrics and Audit Events

**Metrics**

- Daily active teachers
- Attendance sessions completed via app
- Median marking time
- Sync success rate and retry count
- Conflict rate
- Crash-free sessions
- Marks submission completion
- Payslip views

**Audit events**

- Teacher signed in/out
- Device registered/revoked
- Attendance submitted/corrected via app
- Offline conflict resolved
- Marks submitted
- Leave requested
- Payslip downloaded
- Guardian contact viewed (if enabled)

## 12. Open Questions

- Should teachers use phone OTP or school-issued email/password at beta?
- Is app PIN required by pilot schools?
- Should teachers see guardian phone numbers?
- Is offline attendance allowed for yesterday as well as today?
- Which device management policy is required if a device is shared?
