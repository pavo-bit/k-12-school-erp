# Build Log

## 2026-11-14 — Milestone 0: Scaffold

- Created monorepo (pnpm + Turborepo), apps (web, worker, pdf-worker), packages, mobile, infra.
- Added .gitignore, .gitattributes, .env.example, docker-compose, CI workflow, ESLint, Prettier.
- Added root README and documentation/25-build-plan.md.
- Initialized Git repository and committed scaffold.
- Initialized CodeGraph and configured OpenCode skills/MCP.

## 2026-11-14 — Milestone 1: Identity and platform schema

- Added Drizzle schema for organizations, schools, school_settings, academic_years, plans, entitlements, usage_records, impersonation_sessions.
- Added identity schema: users, accounts, sessions, verifications, two_factor, roles, permissions, role_permissions, memberships, invitations, otp_challenges, mobile_sessions, mobile_devices.
- Added audit_logs, outbox_events, idempotency_keys, document_sequences.
- Generated and applied migration `0000_shallow_shaman.sql`.
- Created database roles: erp_migrations, erp_app, erp_readonly, erp_staging_app.
- Added RLS policies for tenant tables, schools, organizations, audit_logs.
- Added helper functions in `app` schema.

### Progress (Phase 1: Operational Core)

- Implemented transactional `withTenantContext` with `SET LOCAL` context.
- Implemented seed data (organization, school, academic year, roles, permissions, admin user).
- Implemented development auth endpoints: login, logout, me.
- Implemented tenant resolution from host or `?school=` query parameter.
- Verified login and `/api/v1/me` return user, role, and school ID.
- Removed debug routes after verification.
- Attempted Better Auth schema generation; deferred full integration to keep local system runnable.
- Implemented platform module: create organization, create school, invite staff.
- Added `withApi` wrapper for auth and tenant context.
- Verified platform onboarding endpoints locally.
- Implemented SIS module: create/list/get students, create guardians, link guardians, create enrollments.
- Implemented academics module: create/list classes, sections, subjects.
- Implemented attendance module: create sessions, mark records, submit sessions.
- Implemented fees module: create fee heads, fee structures, generate invoices, record payments with receipts.
- Verified full flow: school → class → section → student → attendance → fee head → fee structure → invoice → payment → receipt.
- Updated BUILD_LOG and documentation as needed.

### Next

- Replace development auth with Better Auth integration.
- Implement RLS isolation tests.
- Implement tenant resolution middleware for all routes.
- Add audit log verification tests.
- Implement exams, admissions, HR/payroll, communication, reports (Phase 2/3).
