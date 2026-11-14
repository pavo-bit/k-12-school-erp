# Platform and Onboarding

**Prefix:** `FR-PLAT`  
**Release:** Beta; enhancements at GA  
**Owner:** Product / Platform

---

## 1. Purpose

Enable the platform team to create and configure a school without engineering involvement, and enable school admins to prepare the system for daily use.

## 2. Actors and Permissions

| Actor                    | Permissions                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Platform admin           | Create organization/school, manage plan/entitlements, impersonate with audit, view usage |
| Organization owner       | Manage branches, shared staff, organization-level reports                                |
| School admin / principal | Configure school, academic year, classes, staff, roles, templates                        |
| Accountant               | Configure fee heads and structures (with admin approval)                                 |
| Teacher                  | View assigned classes; no platform configuration                                         |

## 3. Release Scope

**Beta**

- Organization and school creation
- School profile, branding, slug reservation
- Academic year setup
- Classes, sections, subjects, class-subject mapping
- Staff invitations and role assignment
- Student/guardian import
- Fee head and structure setup
- Notification template setup
- Go-live checklist
- Basic platform admin: school list, status, impersonation, audit

**GA**

- Plan entitlements and usage metering
- Support notes and ticket references
- School suspension/reactivation
- Data export and deletion workflow
- Organization-level dashboards
- Onboarding automation for subdomains and sender identities

## 4. Functional Requirements

- **FR-PLAT-001 (MUST):** Platform admin can create an organization with name, billing contact, and status.
- **FR-PLAT-002 (MUST):** Platform admin can create a school under an organization with name, board, address, timezone, currency, and locale.
- **FR-PLAT-003 (MUST):** School slug is unique, reserved against a blocklist, and used for `{slug}.erp.com`.
- **FR-PLAT-004 (MUST):** School admin can upload a logo and set brand colors within contrast limits.
- **FR-PLAT-005 (MUST):** Academic year has name, start date, end date, and status (`planning`, `active`, `closing`, `closed`).
- **FR-PLAT-006 (MUST):** Only one academic year can be active per school at a time.
- **FR-PLAT-007 (MUST):** School admin can create classes, sections, subjects, and map subjects to classes.
- **FR-PLAT-008 (MUST):** School admin can invite staff by email or phone; invite expires after 7 days.
- **FR-PLAT-009 (MUST):** Roles and permissions are seeded with sensible defaults and can be customized at GA.
- **FR-PLAT-010 (MUST):** School admin can import students, guardians, staff, fee structures, and opening dues from templates.
- **FR-PLAT-011 (MUST):** Imports support a dry run with row-level errors and a commit step.
- **FR-PLAT-012 (MUST):** Go-live checklist verifies branding, academic year, classes, staff, students, fees, and notification templates.
- **FR-PLAT-013 (MUST):** Platform admin can view school status, student count, plan, and last activity.
- **FR-PLAT-014 (MUST):** Platform admin can impersonate a school user with a reason, time limit, visible banner, and full audit.
- **FR-PLAT-015 (MUST):** Impersonation blocks payments, refunds, payroll approval, and permission changes.
- **FR-PLAT-016 (SHOULD):** School admin can preview the parent and teacher app branding.
- **FR-PLAT-017 (SHOULD):** Platform admin can suspend a school for non-payment or policy violation.
- **FR-PLAT-018 (SHOULD):** Usage metering records active students for billing.

## 5. Business Rules

1. A school must have exactly one active academic year before attendance, fees, or exams can be used.
2. A class must belong to an academic year; sections belong to a class.
3. A student enrollment is unique per student per academic year.
4. A teacher assignment is unique per teacher, class, section, subject, and academic year.
5. Reserved slugs include `www`, `api`, `admin`, `app`, `status`, `docs`, `mail`, `support`, `staging`, `test`, and common profanity.
6. School deletion is a soft archive; data export and deletion follow the DPDP retention policy.
7. Plan entitlements gate modules, not database tables; disabled modules return a clear upgrade message.
8. Impersonation sessions expire after 30 minutes by default and cannot be extended without a new approval.

## 6. Key Data

`organizations`, `schools`, `academic_years`, `classes`, `sections`, `subjects`, `class_subjects`, `teacher_assignments`, `users`, `memberships`, `roles`, `permissions`, `role_permissions`, `invitations`, `plans`, `entitlements`, `usage_records`, `impersonation_sessions`, `audit_logs`, `import_jobs`, `import_errors`.

## 7. APIs and Events

**APIs**

- `POST /api/v1/platform/schools`
- `PATCH /api/v1/schools/{id}`
- `POST /api/v1/schools/{id}/academic-years`
- `POST /api/v1/schools/{id}/classes`
- `POST /api/v1/schools/{id}/staff/invite`
- `POST /api/v1/schools/{id}/imports`
- `POST /api/v1/platform/impersonation`
- `GET /api/v1/platform/schools/{id}/usage`

**Events**

- `school.created`
- `school.configured`
- `academic_year.activated`
- `import.completed`
- `staff.invited`
- `impersonation.started`
- `impersonation.ended`

## 8. Imports and Exports

Templates:

- `students.csv`
- `guardians.csv`
- `staff.csv`
- `classes_sections.csv`
- `subjects.csv`
- `fee_structures.csv`
- `opening_dues.csv`
- `timetable.csv`

Validation includes required fields, duplicates, date formats, phone normalization, class/section existence, and fee-head references. Commit is blocked if any critical error remains.

## 9. Edge Cases

- Slug collision or reserved slug
- Academic year overlap
- Class/section rename after enrollments exist
- Import with mixed valid/invalid rows
- Staff invite to an existing user
- Teacher assigned to two sections at the same period
- School suspended while users are logged in
- Impersonation attempted on a suspended school

## 10. Acceptance Criteria

- **Given** a platform admin, **when** they create a school with a unique slug, **then** the school subdomain resolves and the admin can sign in.
- **Given** a school without an active academic year, **when** the admin tries to mark attendance, **then** the system blocks the action with a clear setup message.
- **Given** a 1,000-row student import with three invalid rows, **when** the dry run completes, **then** 997 valid rows are shown and the three errors are downloadable.
- **Given** an impersonation session, **when** the support user opens the fees page, **then** payment and refund actions are disabled and the banner is visible.
- **Given** a school admin, **when** they complete the go-live checklist, **then** the school status becomes `ready` and the platform admin sees it.

## 11. Metrics and Audit Events

**Metrics**

- Time to onboard a school
- Import success rate
- Go-live checklist completion time
- Number of impersonation sessions
- Setup errors per school

**Audit events**

- Organization/school created or updated
- Academic year created/activated/closed
- Role or permission changed
- Staff invited or deactivated
- Import committed or rolled back
- Impersonation started/ended
- Entitlement changed
- School suspended/archived

## 12. Open Questions

- Should plan entitlements be per school or per organization?
- Is organization-level billing required at GA or post-GA?
- What is the default impersonation approval policy for a two-person platform team?
