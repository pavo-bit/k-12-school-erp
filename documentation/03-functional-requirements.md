# Functional Requirements Index

**Status:** Baseline  
**Owner:** Product  
**Related:** [01-product-vision-and-scope.md](01-product-vision-and-scope.md), [modules/](modules/README.md), [16-delivery-roadmap.md](16-delivery-roadmap.md)

---

## 1. Purpose

This document is the index and cross-cutting requirements baseline for the functional modules. Detailed module requirements live in [`modules/`](modules/README.md).

Requirement IDs use the pattern:

```
FR-<MODULE>-<NNN>
```

Examples: `FR-FEE-014`, `FR-ATT-003`, `FR-EXAM-009`.

Priority uses MoSCoW:

- **MUST** — required for the named release.
- **SHOULD** — expected, but can slip with approval.
- **COULD** — desirable if capacity allows.
- **WON'T** — explicitly out of scope for the release.

---

## 2. Release Matrix

| Module                                | Beta — Jun 2027                    | GA — Oct 2027                                     | Post-GA                                           |
| ------------------------------------- | ---------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Platform and onboarding               | MUST                               | MUST                                              | Enhancements                                      |
| Students and admissions               | Students, guardians, enrollment    | Lean admissions                                   | Full admissions CRM                               |
| Attendance and timetable              | Daily attendance, basic timetable  | Enhancements                                      | Period attendance, substitutions, auto-generation |
| Fees and payments                     | MUST                               | Refunds, advanced reports                         | Full accounting integration                       |
| Exams and report cards                | —                                  | MUST                                              | Online exams, question bank                       |
| HR and payroll                        | MUST                               | Enhancements                                      | Statutory filing, appraisals                      |
| Communication                         | MUST                               | Scheduled campaigns, reports                      | Chat, surveys                                     |
| Reports and analytics                 | Basic dashboards                   | Full operational reports, scheduled email reports | BI, custom report builder, warehouse              |
| Parent app                            | Attendance, fees, announcements    | Results, report cards                             | Student portal, transport tracking                |
| Teacher app                           | Offline attendance, payslips/leave | Marks entry                                       | Homework, lesson plans                            |
| Platform administration               | Basic                              | Entitlements, usage, support                      | Automated billing, marketplace                    |
| Transport, library, hostel, inventory | —                                  | —                                                 | Later phases                                      |

---

## 3. Cross-Cutting Functional Requirements

### 3.1 Identity and access

- **FR-XCUT-001 (MUST):** Every user authenticates with a verified phone or email.
- **FR-XCUT-002 (MUST):** Staff can be invited by email or phone and must accept the invite before access.
- **FR-XCUT-003 (MUST):** Parents authenticate by phone OTP and can access only their linked children.
- **FR-XCUT-004 (MUST):** Teachers access only assigned classes, sections, and subjects.
- **FR-XCUT-005 (MUST):** School admins access only their school; platform admins access multiple schools only through an audited mechanism.
- **FR-XCUT-006 (MUST):** Admin roles require TOTP two-factor authentication.
- **FR-XCUT-007 (MUST):** Sessions and devices can be listed and revoked by the user and by school admins.
- **FR-XCUT-008 (MUST):** All authorization is enforced server-side.

### 3.2 Tenant isolation and audit

- **FR-XCUT-010 (MUST):** Every tenant-scoped record carries `school_id`.
- **FR-XCUT-011 (MUST):** Postgres Row Level Security is enabled on all tenant tables.
- **FR-XCUT-012 (MUST):** Cross-tenant access attempts are blocked and tested in CI.
- **FR-XCUT-013 (MUST):** Create, update, delete, publish, refund, payroll, and permission changes are audited.
- **FR-XCUT-014 (MUST):** Audit records include actor, timestamp, IP, user agent, request ID, entity, and before/after values where applicable.
- **FR-XCUT-015 (MUST):** Audit records are append-only and retained for at least seven years for financial events.

### 3.3 Notifications

- **FR-XCUT-020 (MUST):** The system supports email, SMS, WhatsApp, and mobile push.
- **FR-XCUT-021 (MUST):** Notification templates support variables and per-school branding.
- **FR-XCUT-022 (MUST):** SMS templates use DLT-registered headers and template IDs.
- **FR-XCUT-023 (MUST):** WhatsApp templates are approved before use.
- **FR-XCUT-024 (MUST):** Delivery status is recorded per recipient and channel.
- **FR-XCUT-025 (MUST):** Parents can opt out of non-essential communication; essential alerts remain configurable by the school.
- **FR-XCUT-026 (MUST):** Notification failures retry with backoff and surface in the admin exception queue.
- **FR-XCUT-027 (SHOULD):** Per-school messaging usage and cost are tracked.

### 3.4 Imports, exports, and data quality

- **FR-XCUT-030 (MUST):** Bulk imports support CSV/XLSX with a documented template.
- **FR-XCUT-031 (MUST):** Imports run a validation dry run before committing.
- **FR-XCUT-032 (MUST):** Import errors are downloadable with row numbers and reasons.
- **FR-XCUT-033 (MUST):** Imports are idempotent and auditable.
- **FR-XCUT-034 (MUST):** Exports respect role-based data scope and are audited.
- **FR-XCUT-035 (MUST):** Large exports run as background jobs with a download link.
- **FR-XCUT-036 (SHOULD):** Duplicate detection for students by name, date of birth, and guardian phone.

### 3.5 Search, lists, and pagination

- **FR-XCUT-040 (MUST):** Lists support server-side pagination, sorting, and filters.
- **FR-XCUT-041 (MUST):** Student, staff, invoice, and receipt search works by relevant identifiers.
- **FR-XCUT-042 (MUST):** Empty, loading, and error states are defined for every list.
- **FR-XCUT-043 (SHOULD):** Saved views for common filters.

### 3.6 Settings and configuration

- **FR-XCUT-050 (MUST):** School profile, logo, colors, academic year, timezone, currency, and locale are configurable.
- **FR-XCUT-051 (MUST):** Academic years have planning, active, closing, and closed states.
- **FR-XCUT-052 (MUST):** Fee heads, grading schemes, notification templates, and roles are configurable.
- **FR-XCUT-053 (MUST):** Configuration changes are audited.
- **FR-XCUT-054 (SHOULD):** Custom fields for student and staff records.
- **FR-XCUT-055 (WON'T for beta):** Per-school custom code or database extensions.

### 3.7 Localization and accessibility

- **FR-XCUT-060 (MUST):** Web and mobile support English and Hindi at launch.
- **FR-XCUT-061 (MUST):** One regional language is added based on the pilot schools.
- **FR-XCUT-062 (MUST):** INR, lakh/crore formatting, DD/MM/YYYY, and Asia/Kolkata are defaults.
- **FR-XCUT-063 (MUST):** Web meets WCAG 2.1 AA intent; mobile has accessible labels and font scaling.
- **FR-XCUT-064 (MUST):** All user-facing strings are externalized for translation.
- **FR-XCUT-065 (SHOULD):** Report-card templates support English and the chosen regional language.

### 3.8 Reliability and data integrity

- **FR-XCUT-070 (MUST):** Financial mutations are idempotent.
- **FR-XCUT-071 (MUST):** Payment webhooks are signature-verified and replay-protected.
- **FR-XCUT-072 (MUST):** Receipt numbers are gapless per school and financial year.
- **FR-XCUT-073 (MUST):** Published report cards and payroll runs are immutable; corrections create new versions.
- **FR-XCUT-074 (MUST):** Destructive actions require confirmation and are audited.
- **FR-XCUT-075 (MUST):** Soft-delete/archival strategy is explicit per entity; financial records are never hard-deleted.

### 3.9 Error handling and support

- **FR-XCUT-080 (MUST):** Every error has a stable code, human-readable message, and request ID.
- **FR-XCUT-081 (MUST):** Users can contact school support from the app.
- **FR-XCUT-082 (MUST):** Platform support can search schools and users, and impersonate with audit and time limits.
- **FR-XCUT-083 (MUST):** Sensitive actions are blocked during impersonation.
- **FR-XCUT-084 (SHOULD):** In-app help links and contextual guidance for key workflows.

---

## 4. Module Specifications

| Module                   | Document                                                                   | Beta               | GA              |
| ------------------------ | -------------------------------------------------------------------------- | ------------------ | --------------- |
| Platform and onboarding  | [modules/platform-and-onboarding.md](modules/platform-and-onboarding.md)   | Yes                | Enhancements    |
| Students and admissions  | [modules/students-and-admissions.md](modules/students-and-admissions.md)   | Students           | Admissions      |
| Attendance and timetable | [modules/attendance-and-timetable.md](modules/attendance-and-timetable.md) | Yes                | Enhancements    |
| Fees and payments        | [modules/fees-and-payments.md](modules/fees-and-payments.md)               | Yes                | Refunds/reports |
| Exams and report cards   | [modules/exams-and-report-cards.md](modules/exams-and-report-cards.md)     | —                  | Yes             |
| HR and payroll           | [modules/hr-and-payroll.md](modules/hr-and-payroll.md)                     | Yes                | Enhancements    |
| Communication            | [modules/communication.md](modules/communication.md)                       | Yes                | Campaigns       |
| Reports and analytics    | [modules/reports-and-analytics.md](modules/reports-and-analytics.md)       | Basic              | Full            |
| Parent app               | [modules/parent-app.md](modules/parent-app.md)                             | Attendance/fees    | Results         |
| Teacher app              | [modules/teacher-app.md](modules/teacher-app.md)                           | Offline attendance | Marks           |

---

## 5. Acceptance Criteria Conventions

Every module must define:

1. **Primary flows** with acceptance criteria in Given/When/Then form.
2. **Permission matrix** for each action.
3. **Validation rules** and error messages.
4. **Audit events** emitted.
5. **Notification events** emitted.
6. **Import/export behavior** where applicable.
7. **Edge cases** and recovery behavior.
8. **Performance target** for the primary flow.
9. **Accessibility and localization** considerations.
10. **Test coverage** mapped to automated suites.

A module is not “done” until its acceptance criteria are represented in automated tests or a documented manual UAT script.

---

## 6. Out-of-Scope Guardrails

The following are explicitly not part of beta or GA unless a scope change is approved:

- General ledger accounting
- Statutory payroll filing
- Biometric device integrations
- GPS transport tracking
- Library and hostel management
- Online exams and question bank
- Website CMS
- Native iOS at launch
- White-label apps
- Per-school code forks
- AI-generated remarks or predictive analytics
- Multi-country tax/payroll

---

## 7. Traceability

| Requirement set      | Roadmap phase        | Test suite                                        |
| -------------------- | -------------------- | ------------------------------------------------- |
| Platform/onboarding  | Phase 0–1, Phase 3–4 | Tenant isolation, authz, onboarding E2E           |
| Students/admissions  | Phase 1, Phase 3–4   | SIS E2E, import tests                             |
| Attendance/timetable | Phase 1–2            | Offline sync, attendance E2E                      |
| Fees/payments        | Phase 1–4            | Payment E2E, reconciliation, financial invariants |
| Payroll              | Phase 2              | Payroll calculation golden tests                  |
| Exams/report cards   | Phase 3–4            | Marks authz, report-card golden tests             |
| Communication        | Phase 1–4            | Provider adapter tests, template rendering        |
| Reports/dashboards   | Phase 1–4            | Report query, export, and scope tests             |
| Mobile apps          | Phase 1–4            | Maestro E2E, offline matrix                       |
| Security/compliance  | Continuous           | Tenant isolation, authz, pen test                 |

See [12-testing-and-quality.md](12-testing-and-quality.md) for suite definitions.
