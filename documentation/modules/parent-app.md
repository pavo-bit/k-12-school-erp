# Parent App

**Prefix:** `FR-PAPP`  
**Release:** Beta; results and report cards at GA  
**Owner:** Product / Mobile

---

## 1. Purpose

Give parents a fast, trustworthy mobile app for attendance, fees and payments, receipts, results, and school communication. The app is the primary parent surface; the web portal remains a fallback for users without a smartphone.

## 2. Actors and Permissions

| Actor             | Permissions                                                                    |
| ----------------- | ------------------------------------------------------------------------------ |
| Parent / guardian | View and act on linked children only                                           |
| School admin      | Configure app branding, announcements, and support contacts                    |
| Teacher           | No parent-app access; sends class announcements through the teacher app or web |
| Platform admin    | Configure app release settings; no child data without audited support access   |

## 3. Release Scope

**Beta**

- Phone OTP login with verified number
- Multiple children and multiple schools in one account
- Dashboard: attendance, dues, announcements
- Attendance calendar and monthly percentage
- Invoice list, payment via Razorpay/UPI, payment history
- Receipt PDF download and share
- Announcements and push notifications
- Child and guardian profile view
- Contact-detail change request with verification
- Notification preferences and opt-outs
- Support contact and FAQ

**GA**

- Exam results and grades
- Report-card PDF download
- Fee reminders and scheduled dues
- Attendance absence reason submission (school-configurable)
- Document access where the school permits
- In-app consent forms for school-approved purposes
- Hindi and regional language UI

**Post-GA**

- Transport tracking
- Homework and LMS
- Online exam results and analytics
- Chat with school
- Sibling fee summary and combined payment
- Wallet/advance payments

## 4. Functional Requirements

### Account and access

- **FR-PAPP-001 (MUST):** Parent signs in with phone OTP; the phone number must match a verified guardian record.
- **FR-PAPP-002 (MUST):** A parent account can link multiple children across one or more schools.
- **FR-PAPP-003 (MUST):** The app shows only children linked to the authenticated guardian.
- **FR-PAPP-004 (MUST):** A child with multiple guardians is visible to each linked guardian according to permissions.
- **FR-PAPP-005 (MUST):** Sessions use short-lived access tokens and rotating refresh tokens stored in the OS secure store.
- **FR-PAPP-006 (MUST):** The user can view and revoke active devices.
- **FR-PAPP-007 (MUST):** Phone number changes require OTP verification on the new number and school notification.
- **FR-PAPP-008 (MUST):** The app supports account deletion or deactivation consistent with school retention obligations.

### Dashboard and attendance

- **FR-PAPP-010 (MUST):** Dashboard shows the selected child’s attendance status for today.
- **FR-PAPP-011 (MUST):** Attendance calendar shows present, absent, late, half-day, excused, and holiday states.
- **FR-PAPP-012 (MUST):** Monthly attendance percentage is shown with the calculation rule available in help.
- **FR-PAPP-013 (MUST):** Parents receive a push/WhatsApp/SMS absence alert after the school cutoff.
- **FR-PAPP-014 (SHOULD):** Parents can submit an absence reason if the school enables it.
- **FR-PAPP-015 (SHOULD):** Attendance data is cached for offline viewing with a last-updated timestamp.

### Fees and payments

- **FR-PAPP-020 (MUST):** Parent sees outstanding invoices with fee head, amount, due date, and status.
- **FR-PAPP-021 (MUST):** Parent can pay one or more invoices through Razorpay using UPI, cards, or netbanking.
- **FR-PAPP-022 (MUST):** Payment is idempotent; repeated taps or retries do not create duplicate charges.
- **FR-PAPP-023 (MUST):** The app shows a pending state until the server confirms the payment.
- **FR-PAPP-024 (MUST):** Receipt is available after server confirmation and can be downloaded or shared.
- **FR-PAPP-025 (MUST):** Payment history shows successful, pending, failed, and refunded states.
- **FR-PAPP-026 (MUST):** The app never stores card data; payment collection is handled by the gateway SDK.
- **FR-PAPP-027 (MUST):** Parents can contact the school about a payment discrepancy from the payment detail screen.
- **FR-PAPP-028 (SHOULD):** Parents can pay for siblings in separate transactions at beta; combined payment post-GA.
- **FR-PAPP-029 (SHOULD):** Parents receive a reminder before a due date and after an overdue threshold, if enabled.

### Communication and profile

- **FR-PAPP-030 (MUST):** Parent sees school and class announcements addressed to them.
- **FR-PAPP-031 (MUST):** Push notifications open the relevant screen when tapped.
- **FR-PAPP-032 (MUST):** Parent can manage non-essential notification preferences.
- **FR-PAPP-033 (MUST):** Parent can view child profile data and request a correction.
- **FR-PAPP-034 (MUST):** Parent can view the school’s support contact and privacy policy.
- **FR-PAPP-035 (SHOULD):** In-app inbox retains announcements for the academic year.
- **FR-PAPP-036 (SHOULD):** Language can be changed in the app and persists per device.

### Results (GA)

- **FR-PAPP-040 (MUST):** Parent sees results only after the school publishes them.
- **FR-PAPP-041 (MUST):** Result view shows subject marks, grades, total, result status, attendance, and remarks.
- **FR-PAPP-042 (MUST):** Parent can download the report-card PDF.
- **FR-PAPP-043 (MUST):** Historical published results remain available for the academic year.
- **FR-PAPP-044 (SHOULD):** Parent receives a notification when results are published.
- **FR-PAPP-045 (SHOULD):** Report cards support the school’s chosen languages.

## 5. Business Rules

1. Identity is global, but data access is per child-school relationship.
2. A guardian sees a child only while the link is active and permitted by the school.
3. Payment receipts use the school’s legal name, address, and receipt numbering.
4. Online payment confirmation depends on the server, not the client callback.
5. The app must not cache full financial or academic records in plaintext.
6. Push tokens are device-specific and removed on logout.
7. Notification preferences cannot disable legally required or safety-critical messages.
8. The app displays the school’s academic year; cross-year data is separated.
9. Screenshots of report cards are allowed; the app does not attempt to block them.
10. Support cannot view child data from the parent app; support uses audited platform tools.
11. App version below the minimum supported version is blocked with an upgrade prompt.
12. Account deletion removes app access but preserves school records per retention policy.

## 6. Key Data

Server-side entities consumed by the app: `guardians`, `student_guardians`, `students`, `enrollments`, `attendance_records`, `invoices`, `payments`, `receipts`, `announcements`, `notification_preferences`, `results`, `report_cards`, `device_tokens`, `app_sessions`.

Local device data: encrypted cache of child profile, today’s attendance, invoice summary, announcement list, and settings. No offline payment capability.

## 7. APIs and Events

**APIs**

- `POST /api/v1/mobile/auth/otp/request`
- `POST /api/v1/mobile/auth/otp/verify`
- `POST /api/v1/mobile/auth/refresh`
- `POST /api/v1/mobile/auth/logout`
- `GET /api/v1/mobile/me`
- `GET /api/v1/mobile/children`
- `GET /api/v1/mobile/children/{id}/dashboard`
- `GET /api/v1/mobile/children/{id}/attendance`
- `GET /api/v1/mobile/children/{id}/invoices`
- `POST /api/v1/mobile/payments/order`
- `GET /api/v1/mobile/payments/{id}`
- `GET /api/v1/mobile/receipts/{id}`
- `GET /api/v1/mobile/announcements`
- `GET /api/v1/mobile/results`
- `POST /api/v1/mobile/devices`
- `DELETE /api/v1/mobile/devices/{id}`

**Events consumed as push**

- `attendance.absent`
- `invoice.issued`
- `payment.received`
- `payment.failed`
- `result.published`
- `announcement.sent`

## 8. Notifications

| Event            | Default channels            | Urgency       |
| ---------------- | --------------------------- | ------------- |
| Absence          | Push, WhatsApp/SMS fallback | High          |
| Fee due reminder | Push, WhatsApp              | Normal        |
| Payment receipt  | Push, email/WhatsApp        | Normal        |
| Result published | Push, WhatsApp              | Normal        |
| Announcement     | Push, in-app                | Normal        |
| OTP              | SMS                         | Transactional |

## 9. Edge Cases

- Parent changes phone number and loses access to the old number
- Guardian link removed by the school while the parent is signed in
- Child promoted to a new academic year
- Multiple schools with the same child name
- Payment succeeds but the app is closed before confirmation
- Gateway timeout or user cancels checkout
- Duplicate payment attempt
- Refund after receipt issuance
- Offline app launch with stale cache
- Token refresh race after long inactivity
- Push notification for a child no longer linked
- App store review rejects a build

## 10. Acceptance Criteria

- **Given** a verified guardian phone, **when** the parent requests an OTP, **then** a valid OTP signs them in and shows only linked children.
- **Given** a parent with two children, **when** they switch children, **then** attendance, fees, and results update to the selected child.
- **Given** an outstanding invoice, **when** the parent pays successfully, **then** the invoice updates, a receipt is available, and the confirmation is server-verified.
- **Given** a network drop after Razorpay checkout, **when** the app reopens, **then** it reconciles the payment state from the server.
- **Given** a parent without permission for a child, **when** they request that child’s data, **then** the API returns 403.
- **Given** published results, **when** the parent opens results, **then** the report card matches the school’s published version.
- **Given** an app version below minimum, **when** launched, **then** the user sees a blocking upgrade screen with store link.

## 11. Metrics and Audit Events

**Metrics**

- Monthly active parent accounts
- OTP success rate
- Payment conversion and failure reasons
- Receipt downloads
- Push delivery and open rate
- Crash-free sessions
- Support tickets per 1,000 parents
- Result view rate after publish

**Audit events**

- Parent signed in/out
- Device registered/revoked
- Profile correction requested
- Payment initiated/completed
- Receipt downloaded
- Notification preference changed
- Consent recorded/withdrawn
- Account deletion requested

## 12. Open Questions

- Is the parent web portal required at beta or is the app sufficient?
- Should parents be able to pay for multiple children in one transaction?
- Is absence-reason submission required by pilot schools?
- Which regional language ships first?
- Should receipt sharing use a public link or an authenticated download only?
