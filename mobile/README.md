# Android application API guide

The Android applications use the Next.js API hosted by the ERP. The mobile-facing APIs are grouped by role:

- Parent: `/api/v1/mobile/parent`
- Teacher: `/api/v1/mobile/teacher`

Each application has its own implementation folder:

- `mobile/parent-application/`
- `mobile/teacher-application/`

## Authentication

For this first API foundation, requests reuse the existing authenticated web session cookie. Android clients must send it with each request over HTTPS. The API verifies the signed-in account against the active guardian or staff identity in the resolved school.

This is an initial integration contract, not the final production mobile-authentication design. Phone OTP for parents, refresh-token rotation, device registration/revocation and FCM token lifecycle still need their own implementation before store release. Do not ship demo credentials or rely on hardcoded school slugs.

## Parent endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/mobile/parent/children` | Linked children and current active enrolment details |
| GET | `/api/v1/mobile/parent/children/:studentId/attendance` | Submitted attendance records; optional `from` and `to` date filters |
| GET | `/api/v1/mobile/parent/children/:studentId/fees` | Child invoices, outstanding amounts, payment and receipt history |
| GET | `/api/v1/mobile/parent/children/:studentId/results` | Published exam result/report-card summary |
| GET | `/api/v1/mobile/parent/children/:studentId/results/:reportCardId` | Guardian-authorised published report-card PDF |
| GET | `/api/v1/mobile/parent/announcements` | Published/sent school and parent announcements |

Parent child endpoints verify the authenticated guardian-to-student relationship in the selected school. Draft attendance and unpublished report cards are not returned. Fee endpoints are read-only; they do not initiate payments.

## Teacher endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/mobile/teacher/profile` | Authenticated teacher's staff profile |
| GET | `/api/v1/mobile/teacher/sections` | Assigned sections and subjects |
| GET | `/api/v1/mobile/teacher/sections/:sectionId/roster` | Active student roster for an assigned section |
| GET | `/api/v1/mobile/teacher/attendance/sessions?sectionId=&date=` | Attendance sessions for an assigned section |
| POST | `/api/v1/mobile/teacher/attendance/sessions` | Create an attendance session in an assigned section |
| GET | `/api/v1/mobile/teacher/attendance/records?sessionId=` | Read attendance records for an assigned session |
| POST | `/api/v1/mobile/teacher/attendance/records` | Mark attendance and optionally submit the session |
| POST | `/api/v1/mobile/teacher/attendance/sync` | Idempotent batch sync for up to 10 offline operations |
| GET | `/api/v1/mobile/teacher/announcements` | Published/sent staff and teacher announcements |

Teacher section and attendance APIs verify an active staff identity and a teacher assignment. Attendance writes validate that submitted student IDs belong to the assigned section's active roster.

## Common response envelope

Success:

```json
{
  "data": {},
  "meta": { "request_id": "..." }
}
```

Error:

```json
{
  "error": {
    "code": "SECTION_NOT_ASSIGNED",
    "message": "This section is not assigned to you."
  }
}
```

## Important integration gaps

- Existing mobile auth still uses the development email/password session flow. Parent phone OTP is not implemented by this API work.
- Payment initiation, gateway callbacks and confirmed parent payment state must be added only after a verified payment gateway integration is available.
- Teacher marks entry, leave and payslip endpoints remain separate work.
- Offline attendance must be tested on physical Android devices with app restart, duplicate retry, network loss and concurrent admin correction scenarios.
- The API branch must pass typecheck, lint, migration-backed integration tests and HTTP authorization tests before merging.
