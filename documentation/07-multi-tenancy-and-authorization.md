# Multi-Tenancy and Authorization

**Status:** Baseline  
**Owner:** Engineering / Security  
**Related:** [04-system-architecture.md](04-system-architecture.md), [08-data-model.md](08-data-model.md), [09-api-contracts.md](09-api-contracts.md), [11-security-and-compliance.md](11-security-and-compliance.md)

---

## 1. Tenancy Model

```
Organization (trust / school group)
  └── School (branch or standalone school)
        ├── Academic year
        ├── Classes → Sections
        ├── Students → Enrollments
        ├── Staff → Memberships
        └── Fee, attendance, exam, payroll data
```

| Entity        | Scope           | Notes                                          |
| ------------- | --------------- | ---------------------------------------------- |
| Organization  | Global          | Billing and trust-level grouping               |
| School        | Tenant boundary | Every tenant record carries `school_id`        |
| Academic year | School          | One active year per school                     |
| User          | Global          | A person can belong to multiple schools        |
| Guardian      | Global          | A parent can have children in multiple schools |
| Membership    | School          | Role assignment for a staff user               |
| Student       | School          | Student records are not shared across schools  |
| Enrollment    | School + year   | Historical record per academic year            |

**Tenant boundary:** `school_id`. Organization-level reporting reads across schools but never exposes one school’s data to another school’s users.

## 2. Isolation Strategy

**Shared database, shared schema, `school_id` on every tenant table, PostgreSQL Row Level Security.**

Why:

- Lowest cost and operational overhead at 20–50 schools.
- One migration path, one connection pool, one backup policy.
- RLS provides defense in depth beyond application checks.
- Cross-tenant reporting for organizations remains possible with explicit policies.

Trade-offs:

- A missing `school_id` or policy is a serious defect; tests and review must be rigorous.
- Noisy-neighbor effects require per-school rate limits and query discipline.
- Per-school restore is harder than database-per-tenant; logical exports mitigate this.

## 3. Database Roles

| Role              | Purpose                              | RLS                            |
| ----------------- | ------------------------------------ | ------------------------------ |
| `erp_migrations`  | Owns schema, runs migrations         | Table owner; bypasses RLS      |
| `erp_app`         | Runtime web/worker queries           | Subject to RLS; no `BYPASSRLS` |
| `erp_readonly`    | Ad-hoc support queries and reporting | Subject to RLS; read-only      |
| `erp_staging_app` | Staging runtime                      | Subject to staging RLS         |

The runtime never connects as the table owner. `FORCE ROW LEVEL SECURITY` is enabled so even the owner is subject to policies when not intentionally bypassing.

## 4. RLS Implementation

### 4.1 Session context

Every transaction that touches tenant data sets:

```sql
SET LOCAL app.current_school_id = '00000000-0000-0000-0000-000000000000';
SET LOCAL app.current_user_id = '00000000-0000-0000-0000-000000000000';
SET LOCAL app.current_org_id = '';
SET LOCAL app.is_platform_admin = 'false';
SET LOCAL app.impersonation_id = '';
```

`SET LOCAL` scopes the values to the transaction, preventing leakage across pooled connections.

### 4.2 Policy pattern

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;

CREATE POLICY students_tenant_isolation ON students
  USING (school_id = current_setting('app.current_school_id', true)::uuid)
  WITH CHECK (school_id = current_setting('app.current_school_id', true)::uuid);
```

For tables with an organization dimension:

```sql
CREATE POLICY schools_org_access ON schools
  USING (
    id = current_setting('app.current_school_id', true)::uuid
    OR organization_id = nullif(current_setting('app.current_org_id', true), '')::uuid
  );
```

### 4.3 Parent access

Parents do not have staff memberships. Parent endpoints set both `app.current_user_id` and the child’s `app.current_school_id`. A policy on child-scoped tables also verifies the guardian link:

```sql
CREATE POLICY attendance_guardian_read ON attendance_records
  FOR SELECT
  USING (
    school_id = current_setting('app.current_school_id', true)::uuid
    AND EXISTS (
      SELECT 1
      FROM student_guardians sg
      JOIN guardians g ON g.id = sg.guardian_id
      WHERE sg.student_id = attendance_records.student_id
        AND g.user_id = current_setting('app.current_user_id', true)::uuid
        AND sg.status = 'active'
    )
  );
```

Staff policies are simpler: school scope plus application-level role checks.

### 4.4 Platform administration

Platform tables (`organizations`, `plans`, `usage_records`, `impersonation_sessions`) are not school-scoped or use nullable `school_id`.

Platform admins do **not** get a blanket RLS bypass. To view school data, they use audited impersonation, which sets the target `app.current_school_id` and `app.impersonation_id`. The application blocks sensitive actions during impersonation.

Cross-school aggregate queries for platform analytics run through a dedicated read model or a `SECURITY DEFINER` function with a reviewed, parameterized query. They never return row-level PII.

### 4.5 Rules for new tables

1. Every tenant-owned table has `school_id uuid NOT NULL` and an index leading with `school_id`.
2. Every tenant table has RLS enabled and forced.
3. Every policy includes both `USING` and `WITH CHECK` for writable tables.
4. Migrations that create a table must add RLS in the same migration.
5. CI fails if a table with `school_id` lacks RLS.
6. Cross-tenant foreign keys are prevented by composite keys or triggers.

## 5. Tenant Resolution

| Surface  | Resolution                                                               |
| -------- | ------------------------------------------------------------------------ |
| Web      | Host header → school slug → school ID; session membership must match     |
| Mobile   | Token’s active membership + resource ownership; child ID resolves school |
| API      | Bearer token; `school_id` in the body is ignored for authorization       |
| Webhooks | Provider account mapping; no tenant host required                        |
| Jobs     | Job payload includes `school_id`; worker sets context and re-validates   |

**Never trust client-supplied `school_id` for access control.** It may be accepted as a filter only after the server confirms the user can access that school.

## 6. Authentication

### 6.1 Web staff

- Better Auth with Postgres adapter.
- Email/password or invited account; phone OTP optional per school.
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix where possible.
- Session lifetime: 7 days rolling; absolute 30 days; idle timeout 8 hours for admin roles.
- TOTP MFA required for platform admins, school admins, principals, accountants, and HR/payroll roles.
- Recovery codes generated once; re-enrollment requires another admin.
- Password policy: minimum 12 characters, breached-password check, no forced composition rules.
- Login rate limiting by IP and account; exponential lockout after repeated failures.
- Session list with device, IP, last active; revoke individual or all sessions.

### 6.2 Mobile

- Phone OTP for parents; phone OTP or invited credentials for teachers, per school policy.
- OTP: 6 digits, 5-minute expiry, hashed at rest, max 5 attempts, rate limits per phone/IP/device.
- On success: access JWT (15 minutes) + refresh token (30 days, rotating).
- Refresh tokens stored hashed in `mobile_sessions` with device ID, IP, user agent.
- Refresh token reuse revokes the entire token family and forces re-login.
- Access token claims: `sub`, `sid`, `active_school_id`, `role`, `iat`, `exp`, `iss`, `aud`.
- Tokens stored in iOS Keychain / Android Keystore via Expo SecureStore.
- Logout revokes the session server-side and clears local encrypted data.

### 6.3 Invitations

- Staff invites expire in 7 days and are single-use.
- Invite token is hashed at rest.
- Accepting an invite binds the authenticated identity to the membership.
- A user already belonging to another school can accept without creating a duplicate identity.

## 7. Authorization Model

### 7.1 Roles

| Role               | Scope                      | Summary                                           |
| ------------------ | -------------------------- | ------------------------------------------------- |
| `platform_admin`   | Platform                   | Manage schools, plans, support, impersonation     |
| `org_owner`        | Organization               | Cross-branch reporting, org settings              |
| `school_admin`     | School                     | Full school configuration and operations          |
| `principal`        | School                     | Academic and operational oversight, approvals     |
| `accountant`       | School                     | Fees, collection, payroll review, reports         |
| `hr`               | School                     | Staff, leave, payroll preparation                 |
| `exam_coordinator` | School                     | Exams, marks lock, report-card publish            |
| `front_desk`       | School                     | Admissions, student records, basic queries        |
| `teacher`          | Assigned sections/subjects | Attendance, marks, own payslips/leave             |
| `class_teacher`    | Assigned section           | Teacher plus section roster and consolidated view |
| `staff`            | Self                       | Own profile, leave, payslips                      |
| `parent`           | Linked children            | Child attendance, fees, results, announcements    |

Roles are seeded. Custom roles at GA are composed from permissions, not arbitrary code.

### 7.2 Permissions

Permissions use `resource.action` names:

```
students.read            students.create          students.update
students.archive         students.export          documents.read
attendance.mark          attendance.correct       attendance.export
fees.structure.manage    fees.invoice.issue       fees.payment.record
fees.refund.approve      fees.report.read         fees.reconcile
exams.marks.enter        exams.marks.lock         exams.publish
payroll.prepare          payroll.approve          payroll.export
staff.read               staff.manage             leave.approve
comms.announcement.send  comms.template.manage    reports.read
settings.manage          roles.manage             audit.read
platform.school.manage   platform.impersonate     platform.usage.read
```

Permission checks are server-side and centralized:

```ts
await authorize(ctx, "fees.refund.approve", { schoolId, resource });
```

The check resolves the membership, role permissions, and resource scope in one place.

### 7.3 Scopes

| Scope type      | Example                                        |
| --------------- | ---------------------------------------------- |
| School          | Accountant can read all invoices in the school |
| Section         | Teacher can mark attendance for 8A             |
| Subject-section | Teacher can enter marks for 8A Mathematics     |
| Self            | Staff can read their own payslips              |
| Child           | Parent can read their linked child’s data      |
| Organization    | Org owner can read consolidated reports        |

Resource-level checks are mandatory for teachers and parents. A role alone is not sufficient.

## 8. Enforcement Layers

1. **Edge:** Cloudflare WAF and rate limits; not an authorization boundary.
2. **Route/middleware:** authentication, tenant resolution, CSRF for cookie flows, request validation.
3. **Service:** permission and business-rule checks.
4. **Repository:** every query is tenant-scoped; RLS is the final backstop.
5. **Database:** constraints, composite foreign keys, RLS.
6. **Audit:** sensitive actions recorded with actor and context.

A missing check at one layer must not result in cross-tenant access because of the others.

## 9. Sensitive Actions

The following require elevated checks, audit, and sometimes a second approver:

- Refunds and concessions
- Payroll approval and lock
- Report-card publish and reissue
- Role and permission changes
- Student deletion/archive and data export
- Fee structure changes after invoices exist
- Bank/statutory detail changes
- Impersonation
- School suspension

Segregation of duties is configurable: preparer ≠ approver for payroll and refunds where the school requires it.

## 10. Impersonation

| Control      | Requirement                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Initiation   | Platform admin with `platform.impersonate`, reason, ticket reference                            |
| Approval     | Second platform admin approves if more than one is available; otherwise time-bound and reviewed |
| Duration     | 30 minutes, no silent extension                                                                 |
| Visibility   | Persistent banner with school, admin, and end time                                              |
| Audit        | Start, end, every request context, and actions taken                                            |
| Restrictions | Block payments, refunds, payroll approval, role changes, secret access                          |
| Data         | No bulk export during impersonation                                                             |
| Revocation   | Target school admin can see active sessions and request termination                             |

## 11. Cross-Tenant Testing

Automated tests must prove:

- School A user cannot read, update, delete, export, or infer School B records by ID.
- Changing a `school_id` in a request body has no effect.
- A teacher cannot access an unassigned section.
- A parent cannot access another guardian’s child.
- A worker job for School A cannot mutate School B.
- A platform admin without impersonation cannot query school tables.
- A revoked session cannot access data.
- An expired or reused refresh token is rejected.
- RLS blocks raw queries executed with the app role and no context.
- Export and report endpoints respect scope.

These tests run on every pull request and are part of the release gate.

## 12. Failure Behavior

| Scenario                                 | Response                                         |
| ---------------------------------------- | ------------------------------------------------ |
| Missing tenant context                   | Reject with 400/403; never run an unscoped query |
| School mismatch between host and session | 403 and audit event                              |
| Deactivated membership                   | 403; clear session                               |
| Deleted school                           | 410 or branded unavailable page                  |
| RLS policy error                         | Fail closed; alert                               |
| Database role misconfigured              | Startup readiness check fails                    |
| Token signed with wrong key              | 401; no detail leak                              |
| Too many failed OTP attempts             | Temporary lock with generic message              |

## 13. Related Documents

- [08-data-model.md](08-data-model.md)
- [09-api-contracts.md](09-api-contracts.md)
- [11-security-and-compliance.md](11-security-and-compliance.md)
- [12-testing-and-quality.md](12-testing-and-quality.md)
- [adr/0002-shared-database-with-rls.md](adr/0002-shared-database-with-rls.md)
