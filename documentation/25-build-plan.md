# Build Plan: Structure, Low-Level Design, and Database System

**Status:** Proposed  
**Owner:** Engineering / Founders  
**Date:** 14 November 2026  
**Related:** [04-system-architecture.md](04-system-architecture.md), [05-tech-stack.md](05-tech-stack.md), [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md), [08-data-model.md](08-data-model.md), [09-api-contracts.md](09-api-contracts.md), [16-delivery-roadmap.md](16-delivery-roadmap.md), [20-engineering-standards.md](20-engineering-standards.md), [22-local-development.md](22-local-development.md)

---

## 1. Purpose

This document turns the baseline architecture and data model into an implementation blueprint: the repository layout, module boundaries, runtime lifecycle, database design, migration strategy, and build order. It is the bridge between the documentation baseline and the first code commit. It does not change locked decisions; where it proposes a refinement, that is called out explicitly.

---

## 2. Planning Stance

1. **Modular monolith.** Three runtime services (`web`, `worker`, `pdf-worker`) plus the mobile app.
2. **Shared PostgreSQL database**, `school_id` on every tenant table, Row Level Security as the final backstop.
3. **Drizzle ORM + SQL-first migrations.** Migrations are immutable after merge.
4. **Vertical slices.** Each milestone ships a working path end to end, not a layer in isolation.
5. **No code changes in this document.** It is a plan; implementation starts only after the decisions in Section 10 are confirmed.

---

## 3. Repository Structure

```text
School-ERP/
├─ apps/
│  ├─ web/
│  │  ├─ src/app/
│  │  │  ├─ (auth)/
│  │  │  ├─ (platform)/
│  │  │  ├─ (school)/
│  │  │  ├─ api/v1/
│  │  │  ├─ healthz/route.ts
│  │  │  └─ readyz/route.ts
│  │  ├─ src/server/
│  │  │  ├─ context.ts
│  │  │  ├─ with-api.ts
│  │  │  ├─ tenant.ts
│  │  │  ├─ errors.ts
│  │  │  └─ logging.ts
│  │  ├─ middleware.ts
│  │  └─ Dockerfile
│  ├─ worker/
│  │  ├─ src/
│  │  │  ├─ server.ts
│  │  │  ├─ verify-oidc.ts
│  │  │  ├─ jobs/
│  │  │  ├─ outbox/
│  │  │  └─ providers/
│  │  └─ Dockerfile
│  └─ pdf-worker/
│     ├─ src/
│     │  ├─ server.ts
│     │  └─ render.ts
│     └─ Dockerfile
├─ packages/
│  ├─ db/
│  │  ├─ schema/
│  │  ├─ migrations/
│  │  ├─ rls/
│  │  ├─ seed/
│  │  ├─ client.ts
│  │  ├─ tenant.ts
│  │  ├─ outbox.ts
│  │  ├─ sequences.ts
│  │  └─ audit.ts
│  ├─ core/
│  ├─ auth/
│  ├─ contracts/
│  ├─ modules/
│  │  ├─ platform/
│  │  ├─ students/
│  │  ├─ attendance/
│  │  ├─ fees/
│  │  ├─ exams/
│  │  ├─ hr/
│  │  ├─ communication/
│  │  └─ reports/
│  ├─ documents/
│  ├─ ui/
│  ├─ config/
│  └─ testing/
├─ mobile/
│  ├─ app/
│  └─ src/
├─ infra/
│  ├─ terraform/
│  ├─ docker/
│  └─ cloudflare/
├─ .github/workflows/
├─ docker-compose.yml
├─ turbo.json
├─ pnpm-workspace.yaml
└─ package.json
```

Module layout:

```text
packages/modules/fees/
├─ domain/
├─ service/
├─ repository/
├─ routes/
├─ schemas/
├─ events/
├─ tests/
└─ index.ts
```

**Refinement:** the engineering standards list repositories under `packages/db`, but module boundary rules require repositories to be private to each module. I recommend module-owned repositories and keeping `packages/db` to schema, migrations, RLS, client, and shared DB helpers.

---

## 4. Module Boundaries and Dependency Direction

```text
platform → students → fees / attendance / exams / hr / communication / reports
```

Rules:

1. Other modules import only the module’s `index.ts` public surface.
2. Repositories are private to their module.
3. Cross-module reads use a service call or a read model.
4. Reporting may query across modules only in `packages/modules/reports` with reviewed SQL.
5. Shared business rules belong in a module, not in `core`.
6. Circular dependencies fail the build.
7. Boundaries are enforced with `eslint-plugin-boundaries` or `dependency-cruiser`.

Shared packages:

- `packages/core` — money, dates, IDs, `Result`, errors.
- `packages/auth` — Better Auth, RBAC, permissions.
- `packages/contracts` — Zod DTOs, OpenAPI metadata, typed client.
- `packages/documents` — PDF templates and render contracts.
- `packages/testing` — factories, fixtures, DB helpers.

---

## 5. Low-Level Runtime Design

### 5.1 Web request path

1. Cloudflare Worker resolves `{school}.erp.com` and forwards with `X-Tenant-Host` and `X-Origin-Secret`.
2. Next.js middleware rejects a missing or incorrect origin secret and resolves the school.
3. `withApi` builds the request context: request ID, user, membership, school, locale.
4. The handler validates input with Zod and calls `authorize(ctx, permission, resource)`.
5. The service opens `withTenantContext(ctx.schoolId, ctx.userId, ...)`.
6. Repository queries run with RLS active.
7. The wrapper maps domain errors, writes structured logs, and returns the standard envelope.

### 5.2 Worker path

1. Cloud Tasks calls the worker with an OIDC token.
2. `verify-oidc` validates audience and service account.
3. The job registry validates the payload and resolves `school_id`.
4. `withTenantContext` sets the tenant context.
5. The handler runs idempotently and writes audit/outbox rows in the same transaction.
6. Permanent failures surface in an exception queue.

### 5.3 PDF path

1. Worker enqueues a signed render job.
2. `pdf-worker` validates OIDC or HMAC.
3. `packages/documents` renders React templates to HTML.
4. Chromium prints to PDF.
5. The PDF is uploaded to GCS; the worker stores the object path.

### 5.4 Webhook path

1. Read the raw body before JSON parsing.
2. Verify the provider signature in constant time.
3. Insert `gateway_events` with a unique `(gateway, event_id)`.
4. In one transaction: create payment, allocations, receipt, and outbox event.
5. Return `200`; duplicate events are acknowledged without reprocessing.

### 5.5 Shared wrappers

- `withApi` — request ID, auth, tenant, validation, authorization, idempotency, error mapping.
- `withJob` — OIDC, payload validation, tenant context, idempotency, error handling.
- `withWebhook` — raw body, signature verification, global context.
- `withTenantContext` — transaction, `SET LOCAL` context, commit/rollback.

---

## 6. Database System

### 6.1 Roles, schemas, extensions

- All tables live in `public`; helper functions live in `app`.
- `erp_migrations` owns schema and has `BYPASSRLS` for migrations.
- `erp_app` is the runtime role with no `BYPASSRLS`; subject to RLS.
- `erp_readonly` is read-only and subject to RLS.
- Extensions: `pg_trgm`, `pgcrypto`, `pg_stat_statements`.
- Every tenant table has `school_id`, RLS enabled and forced, and an index leading with `school_id`.

Helper functions:

```sql
app.current_school_id()   -- uuid or null
app.current_user_id()     -- uuid or null
app.current_org_id()      -- uuid or null
app.is_platform_admin()   -- boolean
app.impersonation_id()    -- uuid or null
app.financial_year(date)  -- '2027-28'
```

### 6.2 Universal table pattern

Every tenant table gets:

```text
id uuid primary key
school_id uuid not null references schools(id)
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
created_by uuid references users(id)
updated_by uuid references users(id)
archived_at timestamptz
unique (school_id, id)            -- required for composite FKs
```

Mutable financial and exam records also get `version integer not null default 1`. Cross-tenant references use composite foreign keys:

```sql
foreign key (school_id, student_id) references students (school_id, id)
```

### 6.3 Table inventory by migration slice

| Slice                         | Tables                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0001 bootstrap**            | extensions, roles, `app` functions, `schema_migrations`                                                                                                                                                                                                                                                                                                                                                       |
| **0002 identity/platform**    | `organizations`, `schools`, `school_settings`, `academic_years`, `users`, `accounts`, `sessions`, `verifications`, `two_factor`, `memberships`, `roles`, `permissions`, `role_permissions`, `invitations`, `otp_challenges`, `mobile_sessions`, `mobile_devices`, `plans`, `entitlements`, `usage_records`, `impersonation_sessions`, `audit_logs`, `outbox_events`, `idempotency_keys`, `document_sequences` |
| **0003 SIS/academics**        | `students`, `guardians`, `student_guardians`, `enrollments`, `student_documents`, `student_consents`, `classes`, `sections`, `subjects`, `class_subjects`, `teacher_assignments`                                                                                                                                                                                                                              |
| **0004 attendance/timetable** | `holidays`, `periods`, `timetable_slots`, `attendance_sessions`, `attendance_records`, `attendance_corrections`, `staff_attendance`, `sync_operations`                                                                                                                                                                                                                                                        |
| **0005 fees/payments**        | `fee_heads`, `fee_structures`, `fee_structure_lines`, `fee_assignments`, `concessions`, `invoices`, `invoice_lines`, `payments`, `payment_allocations`, `receipts`, `credit_notes`, `refunds`, `gateway_orders`, `gateway_events`, `settlements`, `reconciliation_runs`, `reconciliation_exceptions`                                                                                                          |
| **0006 exams**                | `exam_terms`, `exams`, `exam_subjects`, `grading_schemes`, `grade_bands`, `marks`, `mark_submissions`, `results`, `report_card_templates`, `report_cards`                                                                                                                                                                                                                                                     |
| **0007 HR/payroll**           | `staff`, `staff_documents`, `leave_types`, `leave_policies`, `leave_balances`, `leave_requests`, `salary_components`, `salary_structures`, `salary_structure_lines`, `payroll_runs`, `payroll_items`, `payslips`, `payroll_adjustments`, `statutory_rates`                                                                                                                                                    |
| **0008 communication**        | `notification_templates`, `template_versions`, `template_approvals`, `announcements`, `announcement_audiences`, `notifications`, `notification_deliveries`, `notification_preferences`, `opt_outs`, `provider_configs`, `message_costs`                                                                                                                                                                       |
| **0009 reports/imports**      | `daily_attendance_summaries`, `daily_fee_summaries`, `enrollment_snapshots`, `report_jobs`, `report_exports`, `scheduled_reports`, `import_jobs`, `import_errors`, `export_jobs`                                                                                                                                                                                                                              |
| **0010 admissions**           | `enquiries`, `applications`, `application_notes`, `admission_status_history`                                                                                                                                                                                                                                                                                                                                  |

RLS is added in the same migration as each table. Slice `0011` is a verification and hardening pass, not where policies first appear.

### 6.4 Representative DDL

```sql
create table students (
  id uuid primary key,
  school_id uuid not null references schools(id),
  admission_number text not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender text not null check (gender in ('male','female','other')),
  status text not null default 'active'
    check (status in ('active','archived','transferred')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id),
  updated_by uuid references users(id),
  archived_at timestamptz,
  unique (school_id, id),
  unique (school_id, admission_number)
);

create index students_name_trgm
  on students using gin ((first_name || ' ' || last_name) gin_trgm_ops);

alter table students enable row level security;
alter table students force row level security;

create policy students_tenant on students
  using (school_id = app.current_school_id())
  with check (school_id = app.current_school_id());
```

Financial tables add a deferred constraint trigger so multi-row invariants are checked at commit:

```sql
create constraint trigger payment_allocation_sum_check
after insert or update or delete on payment_allocations
deferrable initially deferred
for each row execute function app.assert_payment_allocation_sum();
```

That trigger verifies that allocations for a payment sum exactly to `payments.amount_paise`, that `invoices.paid_paise` matches active allocations, and that no allocation points to a cancelled invoice.

### 6.5 RLS policy matrix

| Table group                        | Staff policy                 | Parent policy                       | Platform access    |
| ---------------------------------- | ---------------------------- | ----------------------------------- | ------------------ |
| `schools`                          | `id = current_school`        | —                                   | list metadata only |
| `students`, `enrollments`          | `school_id = current_school` | guardian link exists                | impersonation only |
| `attendance_records`               | `school_id = current_school` | guardian link exists                | impersonation only |
| `invoices`, `payments`, `receipts` | `school_id = current_school` | guardian link where applicable      | impersonation only |
| `marks`, `results`, `report_cards` | `school_id = current_school` | guardian link plus published status | impersonation only |
| `audit_logs`                       | `school_id = current_school` | —                                   | platform scope     |
| `outbox_events`, `gateway_events`  | infrastructure table, no RLS | —                                   | app role only      |

Platform admins do not get a blanket bypass. They use audited impersonation with a 30-minute session and blocked sensitive actions.

### 6.6 Sequences, idempotency, outbox

**Gapless documents:** `document_sequences` is unique on `(school_id, document_type, financial_year)`. The number is allocated inside the same transaction using an atomic upsert/increment, so a rollback also rolls back the number.

**Idempotency:** `idempotency_keys` is unique on `(school_id, key)`, stores the request hash, status, response status/body, and expiry. Payment keys live 7 days; other keys 24 hours.

**Outbox:** `outbox_events` has `event_type`, `aggregate_type`, `aggregate_id`, `dedupe_key`, `payload`, `status`, `attempts`, `available_at`, `locked_at`, and `last_error`. A partial index on `status = 'pending'` keeps dispatch cheap. The dispatcher claims rows with `FOR UPDATE SKIP LOCKED`, creates a deterministic Cloud Task, and workers update the row to `processing/completed/failed`.

### 6.7 Index plan

Minimum indexes:

- `(school_id, created_at)` on large tenant tables.
- `(school_id, student_id, status, due_date)` on invoices.
- `(school_id, received_at)` and `(school_id, gateway_payment_id)` on payments.
- `(school_id, section_id, date)` and `(school_id, student_id, date)` on attendance.
- `(school_id, exam_subject_id)` and `(school_id, student_id)` on marks.
- `(school_id, entity_type, entity_id)` on audit logs.
- Partial unique index for one active academic year per school.
- Trigram indexes on student/guardian names and admission numbers.
- Outbox partial index on pending rows ordered by `available_at`.

### 6.8 Connection budget

The current documentation says a pool of 10 per instance and up to 10 web instances, which would exceed a 100-connection database. I recommend tightening this:

| Service            | Pool per instance | Max instances | Max connections |
| ------------------ | ----------------: | ------------: | --------------: |
| web                |                 5 |             8 |              40 |
| worker             |                 4 |             6 |              24 |
| pdf-worker         |                 2 |             3 |               6 |
| migrations/support |                 — |             — |     30 headroom |
| **Total**          |                   |               |         **100** |

Set `idle_in_transaction_session_timeout = 30s`, `lock_timeout = 5s`, and a `statement_timeout` of 30s for web and 15 minutes for workers.

---

## 7. API and Auth Contracts

- `packages/contracts` owns Zod request/response schemas and OpenAPI metadata.
- `withApi` handles request ID, authentication, tenant resolution, validation, authorization, idempotency, and error mapping.
- Cursor pagination is signed and tied to the filter/sort hash.
- Error codes are stable; `404` is preferred over `403` when existence would leak tenant data.
- Better Auth uses plural tables (`users`, `sessions`, `accounts`, `verifications`) and Argon2id password hashing.
- Web sessions: `HttpOnly`, `Secure`, `SameSite=Lax`.
- Mobile: OTP → 15-minute access JWT + 30-day rotating refresh token; refresh reuse revokes the token family.
- RBAC: permissions like `fees.refund.approve`, resolved through membership, role, and resource scope.

---

## 8. Mobile Structure

```text
mobile/
├─ app/
│  ├─ (auth)/
│  ├─ (parent)/
│  ├─ (teacher)/
│  └─ _layout.tsx
└─ src/
   ├─ features/{auth,children,attendance,fees,results,announcements,profile}/
   ├─ lib/{api,auth,db,sync,push,payments,i18n}/
   └─ components/
```

Local SQLite tables for offline attendance:

- `cached_rosters`
- `cached_students`
- `attendance_outbox`
- `sync_state`

`attendance_outbox` stores a client-generated `operation_id`, section, date, student statuses, and sync status. The API validates teacher assignment, cutoff, enrollment, and idempotency, then returns per-item results. Marks and payments stay online.

---

## 9. Infrastructure Plan

- One GCP project for prod and staging, separate databases, services, queues, secrets, and service accounts.
- Cloud Run: `web` min 1 / max 8; `worker` min 0 / max 6; `pdf-worker` min 0 / max 3.
- Cloud SQL PostgreSQL 16, single zone, private IP, PITR 7 days.
- Cloud Tasks queues: notifications, imports, exports, PDF, reconciliation, maintenance.
- Cloud Scheduler: outbox dispatch, fee reminders, attendance alerts, reconciliation, retention, usage snapshot.
- GCS buckets for documents, generated files, exports, backups, Terraform state.
- Secret Manager for DB, auth, Razorpay, Resend, MSG91, WhatsApp, FCM, origin secret, Sentry.
- Cloudflare Worker for wildcard school routing and origin protection.
- Terraform modules for network, SQL, Cloud Run, storage, tasks, IAM, secrets, monitoring.
- GitHub Actions: typecheck, lint, unit, integration with Postgres, build, migrate, deploy staging/prod, Android build.

---

## 10. Build Order

| Milestone            | Scope                                                                                       | Exit criteria                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **0. Skeleton**      | Repo, pnpm/Turborepo, Docker Postgres, CI, health checks, Terraform base, Cloudflare Worker | `pnpm dev` runs; migrations apply; health endpoints work; staging deploy succeeds |
| **1. Tenancy/auth**  | Platform, schools, users, memberships, roles, Better Auth, RLS harness, audit, outbox       | Cross-tenant tests green; admin can create a school and invite staff              |
| **2. SIS/academics** | Students, guardians, enrollments, classes, sections, subjects, imports                      | 1,000-student import; search; isolation tests                                     |
| **3. Fees/payments** | Fee structures, invoices, payments, receipts, Razorpay, reconciliation                      | Payment E2E; gapless receipts; financial invariants                               |
| **4. Attendance**    | Sessions, records, timetable, offline teacher sync                                          | Offline matrix; duplicate sync; conflict handling                                 |
| **5. Payroll/comms** | Staff, leave, payroll, notifications                                                        | Payroll golden tests; four-channel delivery                                       |
| **6. Exams/parent**  | Exams, marks, report cards, parent app                                                      | Report-card PDFs; parent results; publish workflow                                |
| **7. Reports/GA**    | Summaries, exports, load/security hardening                                                 | GA gate                                                                           |

The **first vertical slice** should be:

> create organization → create school → invite admin → login → create academic year/class/section → import students → mark attendance → generate invoice → record offline payment → generate receipt.

That proves tenancy, auth, RLS, audit, outbox, PDF, and the core domain in one path.

---

## 11. Decisions to Confirm Before Building

1. **Git:** the workspace is not a git repository. Should it be initialized before scaffolding?
2. **First milestone:** start with the walking skeleton above, or build the full schema first? I recommend the skeleton.
3. **Repository ownership:** move module repositories into their modules and keep `packages/db` for schema/client/RLS? I recommend yes.
4. **Additions to the data model:** add `verifications`, `two_factor`, `otp_challenges`, `mobile_sessions`, `mobile_devices`, and `packages/documents` for PDF templates. These are implied by the documentation but not explicitly listed.
5. **Worker framework:** use Fastify for `worker` and `pdf-worker`? I recommend Fastify for validation, logging, and OIDC middleware.
6. **Mobile timing:** scaffold the Expo app now, or after the web/API core? I recommend after Milestone 3.

---

## 12. Related Documents

- [04-system-architecture.md](04-system-architecture.md)
- [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md)
- [08-data-model.md](08-data-model.md)
- [09-api-contracts.md](09-api-contracts.md)
- [16-delivery-roadmap.md](16-delivery-roadmap.md)
- [20-engineering-standards.md](20-engineering-standards.md)
- [22-local-development.md](22-local-development.md)
- [23-open-decisions.md](23-open-decisions.md)
