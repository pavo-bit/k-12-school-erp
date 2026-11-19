# Parent Application (Android)

This folder is the dedicated home for the SSVM parent Android application.

The API namespace is `/api/v1/mobile/parent`. The first implementation exposes read-only, school-scoped endpoints for linked children, attendance, fee invoices/payment history, published results and announcements.

## API authentication

Requests currently use the authenticated session created by the existing mobile login flow. Send the session cookie with every API request over HTTPS. The server verifies the authenticated account against an active `student_guardians` → `guardians.user_id` relationship in the resolved school. A child ID supplied by the app is never treated as proof of access.

Phone OTP login, rotating mobile refresh tokens and device registration are separate authentication work and must not be simulated with hardcoded OTPs.

## Endpoints

- `GET /api/v1/mobile/parent/children`
- `GET /api/v1/mobile/parent/children/:studentId/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/v1/mobile/parent/children/:studentId/fees`
- `GET /api/v1/mobile/parent/children/:studentId/results`
- `GET /api/v1/mobile/parent/announcements`

All endpoints return the shared `{ data, meta: { request_id } }` or `{ error: { code, message } }` response envelope.

## Not enabled yet

The current backend does not yet have a verified Razorpay order/webhook flow suitable for parent-app payments. This API intentionally exposes payment and receipt history only; it does not create or mark online payments as successful.
