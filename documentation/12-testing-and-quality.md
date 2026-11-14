# Testing and Quality

**Status:** Baseline  
**Owner:** Engineering / QA  
**Related:** [03-functional-requirements.md](03-functional-requirements.md), [10-mobile-application.md](10-mobile-application.md), [13-cicd-and-release-management.md](13-cicd-and-release-management.md), [14-observability-and-operations.md](14-observability-and-operations.md)

---

## 1. Quality Goals

1. **No cross-tenant defects.** Isolation is tested at the API and database layers.
2. **No money defects.** Financial invariants are enforced and tested under concurrency.
3. **Attendance works offline.** The sync matrix is a release gate.
4. **Report cards are correct.** Golden tests and school sign-off before publish.
5. **Payroll is reproducible.** Approved fixtures produce identical results.
6. **Failures are visible.** Tests, monitoring, and UAT catch problems before schools do.
7. **Quality is everyone’s job.** Engineers write and own tests; QA designs the strategy and adversarial cases.

## 2. Test Strategy

```
        Manual UAT / exploratory
       ─────────────────────────
        E2E web + mobile (few)
       ─────────────────────────
        Integration + contract (many)
       ─────────────────────────
        Unit / domain (most)
```

| Layer       | Proportion | Owned by       | Runs                              |
| ----------- | ---------- | -------------- | --------------------------------- |
| Unit        | ~60%       | Engineers      | Every commit                      |
| Integration | ~25%       | Engineers      | Every PR                          |
| Contract    | ~5%        | Engineers      | Every PR                          |
| E2E         | ~7%        | QA + engineers | Every PR (smoke) / nightly (full) |
| Manual/UAT  | ~3%        | QA + product   | Per release                       |

Coverage is a guide, not a target. Critical domain modules target 90% branch coverage; UI targets behavior coverage over line counts.

## 3. Test Types

### 3.1 Unit tests

**Tool:** Vitest

Scope:

- Money and percentage calculations
- Grading and result computation
- Payroll components, LOP, rounding
- Fee allocation and refund limits
- Attendance status rules and percentage calculation
- Date/timezone helpers
- Validation schemas
- Permission resolution
- Template rendering and variable validation
- Sync conflict decisions

Rules:

- No network, database, or filesystem.
- Deterministic; freeze time and seed randomness.
- One behavior per test; descriptive names.
- Property-based tests with `fast-check` for allocation, rounding, and grade bands.

### 3.2 Integration tests

**Tool:** Vitest + Testcontainers or a dedicated test database.

Scope:

- Repositories with real Postgres and RLS
- Migrations from empty and from a snapshot
- Transactions and constraints
- Outbox writes in the same transaction
- Cloud Tasks enqueue adapters (mocked)
- Provider adapters with recorded fixtures
- File storage adapters (local fake or emulator)
- Job handlers end to end against a test database

Rules:

- Each test runs in a transaction that rolls back, or uses a uniquely seeded school.
- RLS context is set explicitly; tests that forget context must fail.
- No shared mutable fixtures across parallel tests.

### 3.3 Contract tests

- Zod schemas are the contract source.
- OpenAPI generation is checked into the repo; CI fails on drift.
- Mobile uses generated types; a contract change that breaks the minimum app version fails CI.
- Provider webhook fixtures are stored and replayed.
- Adapter interfaces are tested with a shared conformance suite (email, SMS, WhatsApp, payment).

### 3.4 Tenant isolation and authorization tests

This is a dedicated suite, not incidental coverage.

For every tenant-scoped resource:

1. Seed School A and School B with comparable data.
2. Authenticate as each role in School A.
3. Attempt read, list, create, update, delete, export, and report access against School B IDs.
4. Assert `403` or `404`, no data leakage, and an audit/security event where appropriate.
5. Attempt body/path `school_id` tampering.
6. Attempt access with a revoked or expired session.
7. Attempt worker job payload tampering.

Database-level tests:

- Query each table with `school_id` and verify RLS is enabled and forced.
- Query without `app.current_school_id` and expect zero rows or an error.
- Verify composite foreign keys reject cross-tenant references.
- Verify the migration role is not used by runtime.

A metadata test enumerates tables and fails if a new `school_id` table has no RLS policy.

### 3.5 Financial invariant tests

- Payment allocations sum exactly to the payment amount.
- Invoice paid amount equals the sum of active allocations.
- Receipt numbers are gapless under 50 concurrent payments.
- Duplicate webhook events create one payment and one receipt.
- Refunds cannot exceed unallocated amounts.
- Cancelled invoices reject allocations.
- Concession cannot make an invoice negative.
- Rounding is deterministic and documented.
- Currency is always integer paise.
- Reconciliation flags missing, duplicate, and mismatched settlements.

### 3.6 Payroll golden tests

- Maintain approved fixtures per statutory scenario: basic, HRA, PF, ESI, PT, TDS, LOP, mid-month join/exit, arrears.
- The school’s CA signs off on expected values.
- Any change to payroll logic requires updating or re-approving fixtures.
- Payroll runs are reproducible for the same inputs and statutory rate version.
- Payslip PDF content is checked for required fields and masking.

### 3.7 Report-card golden tests

- HTML snapshot per template and locale.
- PDF text extraction verifies student, subjects, marks, grades, attendance, and remarks.
- Visual regression for layout on a small set of representative report cards.
- Missing marks block publish.
- Reissue creates a new version without deleting the prior one.
- Bulk generation of 1,000 students completes within 10 minutes in the performance environment.

### 3.8 Offline sync tests

**Mobile E2E:** Maestro, plus manual device tests.

| Case                              | Expected                                    |
| --------------------------------- | ------------------------------------------- |
| Mark offline, reconnect           | Sync succeeds; status updates               |
| Duplicate sync                    | Server returns duplicate; no duplicate rows |
| Network drop mid-sync             | Partial results; retry completes            |
| App killed before sync            | Draft persists after relaunch               |
| Admin edits while teacher offline | Conflict shown; no silent overwrite         |
| Student transferred               | Record rejected; roster refreshes           |
| Holiday declared                  | Record rejected with reason                 |
| Device clock changed              | Server rejects future/invalid date          |
| Token expired offline             | Re-auth required; unsynced data preserved   |
| Logout with unsynced data         | Warning; explicit confirmation required     |
| Storage full                      | Clear error; no corruption                  |
| App update with pending data      | Migration preserves outbox                  |

### 3.9 End-to-end tests

**Web:** Playwright.

Critical journeys:

- Platform creates school → configures year/classes → imports students → invites staff
- Teacher marks attendance → parent sees it
- Accountant generates invoices → parent pays → receipt → reconciliation
- Exam setup → teacher enters marks → principal publishes → parent views result
- Payroll run → approve → lock → payslip available
- Announcement → delivery status
- Support impersonation → sensitive actions blocked

**Mobile:** Maestro for login, attendance offline, payment, results, and notification deep links.

Rules:

- Run against a seeded staging-like environment.
- Use test provider modes; no live charges or messages.
- Tag tests by module and release.
- Smoke subset on every PR; full suite nightly and before release.

### 3.10 Performance and load tests

**Tool:** k6.

Scenarios:

| Scenario                | Target                                    |
| ----------------------- | ----------------------------------------- |
| Morning attendance peak | 2,000 concurrent teachers/users; p95 < 1s |
| Fee due day             | 500 concurrent payment flows; no errors   |
| Report-card publish     | 1,000 students in < 10 minutes            |
| Student import          | 5,000 rows in < 2 minutes                 |
| Dashboard load          | p95 < 2s on 4G                            |
| API core endpoints      | p95 < 800ms                               |

Also test:

- Database connection pool saturation
- Cloud Tasks backlog drain rate
- PDF worker memory under concurrent renders
- Large export memory behavior
- Rate-limit correctness

Performance tests run before GA and after major architectural changes, not on every PR.

### 3.11 Security tests

- SAST in CI (Semgrep or CodeQL).
- Dependency audit (`pnpm audit`) and license check.
- Secret scanning (GitHub secret scanning + gitleaks).
- DAST against staging before GA (OWASP ZAP baseline).
- Auth and authorization matrix tests.
- Webhook signature and replay tests.
- File upload validation tests.
- Rate-limit tests.
- Security headers test.
- External penetration test before GA.

### 3.12 Accessibility tests

- `axe-core` in Playwright for core pages.
- Keyboard-only navigation for admin flows.
- Screen-reader spot checks with TalkBack and VoiceOver later.
- Contrast checks against design tokens.
- Font scaling at 200% on mobile.
- Focus management in modals and forms.

### 3.13 Localization tests

- Pseudo-locale build with expanded strings.
- Devanagari and regional script rendering in web, PDF, and mobile.
- Date, number, and currency formatting per locale.
- No hard-coded user-facing strings.
- Report-card templates in English and Hindi at minimum.

### 3.14 Migration and restore tests

- Migrations run from an empty database.
- Migrations run from a production-like snapshot in staging.
- Expand/contract compatibility: old code + new schema, new code + old schema during rollout.
- Restore from PITR into a temporary instance; verify row counts and sample records.
- Restore drill before beta and GA, then quarterly.

### 3.15 Failure injection

- Database unavailable during a request.
- Cloud Tasks unavailable while writing an outbox row.
- Razorpay timeout and delayed webhook.
- SMS/WhatsApp provider 5xx and rate limiting.
- PDF worker crash mid-batch.
- Worker crash after side effect but before acknowledgement.
- Cloudflare misconfiguration (simulated in staging).

Expected: graceful errors, retries, no duplicates, alerts fire.

## 4. Test Data

- Factories in `packages/testing` create schools, users, students, classes, invoices, and marks.
- Every test uses a unique school unless it explicitly tests cross-tenant behavior.
- No production PII in test data.
- Seed fixtures are deterministic and versioned.
- Large datasets are generated, not stored.
- Anonymized production data may be used only in staging with approval and irreversible masking.

## 5. Environments

| Environment | Purpose                 | Data               | Providers               |
| ----------- | ----------------------- | ------------------ | ----------------------- |
| Local       | Development             | Synthetic          | Fakes/local             |
| CI          | Automated tests         | Ephemeral Postgres | Mocks                   |
| Staging     | Integration, UAT, demos | Synthetic          | Test mode / allowlisted |
| Production  | Live                    | Real               | Live                    |

Staging must mirror production configuration closely enough to catch routing, auth, and migration issues.

## 6. CI Test Stages

| Stage                  | Runs                  | Budget   |
| ---------------------- | --------------------- | -------- |
| Type check + lint      | Every push            | < 3 min  |
| Unit tests             | Every push            | < 5 min  |
| Integration tests      | Every PR              | < 10 min |
| Contract/OpenAPI check | Every PR              | < 2 min  |
| Build images           | Every PR (main merge) | < 10 min |
| E2E smoke              | Every PR              | < 15 min |
| E2E full               | Nightly and release   | < 45 min |
| Mobile Maestro         | Nightly and release   | < 30 min |
| Security scans         | Every PR + nightly    | < 10 min |
| Performance            | Pre-release           | Manual   |

Parallelize with Turborepo and sharded test runners. Cache dependencies and build outputs.

## 7. Release Gates

### 7.1 Beta — June 2027

- All beta MUST requirements have automated or documented UAT coverage.
- Tenant isolation suite green.
- Financial invariant suite green.
- Offline attendance matrix green on at least three Android devices.
- Payroll golden tests approved by the CA.
- Restore drill passed.
- No open P0/P1 defects.
- Security: no critical/high findings open.
- Pilot school UAT sign-off.

### 7.2 GA — October 2027

- All GA MUST requirements covered.
- Report-card golden tests approved by pilot schools.
- Load test targets met.
- External penetration test complete; critical/high remediated and retested.
- DAST baseline clean or accepted.
- Accessibility spot check passed.
- DPDP documents reviewed.
- Play Store production approval.
- Support runbooks and on-call rotation active.
- No open P0/P1 defects; P2s have accepted dates.

## 8. Coverage Expectations

| Area                                               | Target                                          |
| -------------------------------------------------- | ----------------------------------------------- |
| Domain services (fees, payroll, exams, attendance) | 90% branch                                      |
| API route handlers                                 | 80% branch                                      |
| Repositories and RLS                               | Critical paths covered                          |
| UI components                                      | Behavior coverage for key states                |
| Mobile sync                                        | Full state machine covered                      |
| Overall                                            | No vanity target; critical paths must be tested |

Coverage reports are reviewed monthly. A drop in a critical module blocks merge unless justified.

## 9. Flaky Test Policy

- A flaky test is a defect.
- Quarantine immediately with an owner and ticket; do not silently retry.
- Fix within five working days.
- Retries are allowed only for known infrastructure noise, with a cap of one.
- Nightly reports track flake rate; above 2% triggers a quality review.
- E2E tests must be deterministic: seed data, freeze time, isolate tenants.

## 10. Bug Severity and SLAs

| Severity | Definition                                          | Fix target        |
| -------- | --------------------------------------------------- | ----------------- |
| P0       | Data breach, money loss, total outage, corrupt data | Immediate; hotfix |
| P1       | Major workflow broken, no workaround, many schools  | 24–48 hours       |
| P2       | Important workflow impaired, workaround exists      | 7 days            |
| P3       | Minor bug or single-school edge case                | Next release      |
| P4       | Cosmetic                                            | Backlog           |

Every bug includes reproduction steps, environment, school, request ID, and expected vs actual.

## 11. UAT with Pilot Schools

- UAT scripts by role: principal, accountant, teacher, parent.
- Use staging with the school’s configuration and anonymized sample data.
- Named school contacts test and sign off.
- Defects triaged daily during UAT.
- Sign-off is required before go-live.
- Feedback is categorized as defect, configuration, enhancement, or training.

## 12. Definition of Done

A feature is done when:

1. Acceptance criteria are met.
2. Unit and integration tests pass.
3. Tenant isolation and authorization tests cover new resources.
4. Audit events and notifications are implemented.
5. Error states, empty states, and loading states exist.
6. Accessibility and localization are checked.
7. OpenAPI and typed clients are updated.
8. Migrations are reviewed and reversible/roll-forward documented.
9. Observability: logs, metrics, and alerts where relevant.
10. Documentation and runbooks are updated.
11. Code reviewed and merged.
12. Deployed to staging and verified.
13. Product/QA accepts the behavior.

## 13. Quality Metrics

- Defect escape rate by release
- Production incidents caused by defects
- Test flake rate
- CI duration and failure rate
- Coverage for critical modules
- Offline sync success rate
- Payment reconciliation exceptions
- UAT defect count and closure time
- Mean time to detect and recover

## 14. Related Documents

- [11-security-and-compliance.md](11-security-and-compliance.md)
- [13-cicd-and-release-management.md](13-cicd-and-release-management.md)
- [14-observability-and-operations.md](14-observability-and-operations.md)
- [20-engineering-standards.md](20-engineering-standards.md)
