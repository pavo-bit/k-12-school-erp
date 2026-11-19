# Teacher Application (Android)

This folder is the dedicated home for the SSVM teacher Android application.

The API namespace is `/api/v1/mobile/teacher`. The first implementation exposes the teacher's assigned sections, class rosters, timetable, attendance sessions and records, offline attendance batch sync and school announcements.

## API authentication

Requests currently use the authenticated session created by the existing mobile login flow. Send the session cookie with every API request over HTTPS. The server requires an active staff profile linked to the authenticated user in the resolved school. Section and session operations additionally verify the teacher's assignment.

Phone OTP login, rotating mobile refresh tokens and device registration are separate authentication work and must not be simulated with hardcoded OTPs.

## Endpoints

- `GET /api/v1/mobile/teacher/profile`
- `GET /api/v1/mobile/teacher/sections`
- `GET /api/v1/mobile/teacher/sections/:sectionId/roster`
- `GET /api/v1/mobile/teacher/timetable?dayOfWeek=0..6`
- `GET|POST /api/v1/mobile/teacher/attendance/sessions`
- `GET|POST /api/v1/mobile/teacher/attendance/records`
- `POST /api/v1/mobile/teacher/attendance/sync`
- `GET /api/v1/mobile/teacher/announcements`

Attendance sync accepts up to 10 operations per request. Each operation must have a stable client-generated `operationId`; duplicate completed operations return their stored result.

## Not enabled yet

Teacher marks entry, leave requests and payslip delivery will be added after their assignment and publication rules are wired into dedicated mobile endpoints. Offline attendance must still be tested on physical Android devices.
