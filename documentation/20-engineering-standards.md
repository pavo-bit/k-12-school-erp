# Engineering Standards

**Status:** Baseline  
**Owner:** Engineering  
**Related:** [05-tech-stack.md](05-tech-stack.md), [12-testing-and-quality.md](12-testing-and-quality.md), [13-cicd-and-release-management.md](13-cicd-and-release-management.md)

---

## 1. Principles

1. **Optimize for the next engineer.** Clear names, small functions, obvious data flow.
2. **Make illegal states unrepresentable.** Types, constraints, and validation over comments.
3. **Server-side truth.** Never trust client calculations, permissions, or identifiers.
4. **Explicit over clever.** Boring code is easier to review and operate.
5. **Delete dead code.** No commented-out blocks or unused abstractions.
6. **Document decisions, not mechanics.** Code explains how; ADRs explain why.
7. **Test behavior, not implementation.**
8. **Ship small.** A reviewable change is a safe change.

## 2. Repository Layout

```
apps/
  web/                  Next.js app, route handlers, server actions
  worker/               Cloud Tasks handlers and dispatcher
  pdf-worker/           Chromium rendering service
packages/
  db/                   schema, migrations, RLS, repositories
  core/                 errors, result types, money, dates, IDs
  auth/                 Better Auth config, sessions, RBAC
  modules/              domain modules
    platform/
    students/
    attendance/
    fees/
    exams/
    hr/
    communication/
    reports/
  contracts/            Zod DTOs, OpenAPI metadata
  ui/                   design system
  config/               eslint, tsconfig, env schema
  testing/              factories, fixtures, helpers
mobile/
  app/                  Expo Router routes
  src/                  features, lib, components
infra/
  terraform/
docs/ or documentation/
```

### 2.1 Module structure

```
packages/modules/fees/
  domain/
    invoice.ts
    allocation.ts
    money.ts
  service/
    invoice-service.ts
    payment-service.ts
  repository/
    invoice-repository.ts
  routes/
    invoice-routes.ts
  schemas/
    invoice-schema.ts
  events/
    fee-events.ts
  tests/
    invoice-service.test.ts
```

**Boundary rules**

- Other modules may import only the module’s `index.ts` public surface.
- Repositories are private to their module.
- Cross-module reads use a service call or a read model.
- Reporting may query across modules only in `modules/reports` with reviewed SQL.
- Shared business rules belong in a module, not in `core`.
- Circular dependencies fail the build.

## 3. TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- No `any`. Use `unknown` at boundaries and narrow with Zod.
- Prefer `type` for unions and DTOs; `interface` for extendable object shapes.
- Use discriminated unions for state machines.
- Return `Result<T, E>` for expected domain failures; throw only for unexpected errors.
- Avoid enums; use `as const` objects and union types.
- Use `satisfies` for config objects.
- No non-null assertions (`!`) without a comment explaining the invariant.
- Prefer `readonly` for DTOs and function parameters where practical.
- Validate all external input with Zod at the boundary.
- Do not export mutable module-level state.

## 4. Naming

| Item                  | Convention                 | Example                 |
| --------------------- | -------------------------- | ----------------------- |
| Files                 | kebab-case                 | `invoice-service.ts`    |
| React components      | PascalCase file and export | `InvoiceTable.tsx`      |
| Types/interfaces      | PascalCase                 | `InvoiceLine`           |
| Functions/variables   | camelCase                  | `calculateInvoiceTotal` |
| Constants             | SCREAMING_SNAKE_CASE       | `MAX_PAGE_SIZE`         |
| DB tables/columns     | snake_case                 | `fee_structure_lines`   |
| API fields            | snake_case                 | `amount_paise`          |
| Permission keys       | dot.case                   | `fees.refund.approve`   |
| Event names           | dot.case                   | `payment.received`      |
| Environment variables | SCREAMING_SNAKE_CASE       | `DATABASE_URL`          |
| Feature flags         | kebab-case                 | `fees.refund-workflow`  |

Names should say what a thing is, not how it is implemented. Avoid abbreviations except domain-standard ones (`gst`, `pan`, `lop`, `pt`).

## 5. Formatting and Linting

- Prettier for formatting; no style debates.
- ESLint with TypeScript, import order, React, accessibility, and promise rules.
- `eslint-plugin-boundaries` or equivalent enforces module boundaries.
- Pre-commit: lint-staged runs ESLint and Prettier on changed files.
- CI runs type check, lint, and format check; warnings fail for new code.
- No disabled lint rules without an inline reason.

## 6. Error Handling

**Expected domain failures** use typed errors:

```ts
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
  }
}
```

Rules:

- Never throw strings or plain objects.
- Map domain errors to API responses in one place.
- Do not leak stack traces, SQL, or provider payloads to clients.
- Log unexpected errors once, at the request or job boundary, with context.
- Include a stable `error_code`.
- Retry only transient failures; do not retry validation or permission errors.
- Use idempotency for operations that may be retried.
- Client errors explain what the user can do next.

## 7. Logging

- Structured JSON only.
- Log at boundaries: HTTP request, job start/end, provider call, state transition.
- Include `request_id`, `school_id`, `user_id` where available.
- Never log secrets, tokens, OTPs, card data, bank details, or full PII payloads.
- Use stable event names.
- Errors log `error_code`, message, and stack; not the whole request body.
- Do not use `console.log` in application code; use the shared logger.

## 8. Database Standards

- Every tenant table has `school_id`, RLS, and an index leading with `school_id`.
- Every migration that creates a tenant table adds RLS in the same file.
- Use `timestamptz`, never `timestamp`.
- Store money as `bigint` paise.
- Use `numeric` for marks and percentages.
- Prefer `text` + `CHECK` over native enums.
- Foreign keys are explicit; default `ON DELETE RESTRICT`.
- Use composite FKs including `school_id` where cross-tenant references are possible.
- Use transactions for multi-row invariants.
- Keep transactions short; no external calls inside a transaction.
- Use `SELECT ... FOR UPDATE` deliberately; document lock ordering.
- Use `EXPLAIN (ANALYZE, BUFFERS)` for slow queries.
- Add indexes for measured queries, not speculation.
- Use `pg_trgm` for fuzzy name search.
- Never use `SELECT *` in production repositories.
- Use parameterized queries; no string interpolation.
- Soft-archive financial and academic records; never hard-delete.
- Migration files are immutable after merge; fix forward with a new migration.
- Use `CONCURRENTLY` for large indexes.
- Review lock impact for every migration.

## 9. API Standards

- Follow [09-api-contracts.md](09-api-contracts.md).
- Version in the URL; additive changes only.
- Validate input with Zod; infer types from schemas.
- Return consistent envelopes and stable error codes.
- Require idempotency keys for financial and bulk operations.
- Use `202` for background work with a job ID.
- Enforce permissions in the service layer, not only the route.
- Never trust `school_id` from the client.
- Use cursor pagination for large lists.
- Set request timeouts for provider calls.
- Include `request_id` in every response.
- Document every endpoint in OpenAPI.

## 10. Frontend Standards

- Server Components by default; `"use client"` only for interactivity.
- No secrets or privileged data in client bundles.
- Every data view has loading, empty, error, and unauthorized states.
- Forms use React Hook Form + Zod; server validation is authoritative.
- Use the design system; no one-off buttons or colors.
- Tables use server-side pagination, sorting, and filtering.
- Destructive actions require confirmation and explain consequences.
- Optimistic UI only for low-risk actions; financial actions wait for the server.
- Use semantic HTML and accessible labels.
- Keep client bundles small; lazy-load heavy charts and editors.
- No `dangerouslySetInnerHTML` without sanitization.
- Use `next/image` for images and explicit dimensions to avoid layout shift.
- Test keyboard navigation and focus states.

## 11. Mobile Standards

- All API calls go through the typed client; no ad-hoc `fetch` in screens.
- Offline writes only for attendance, behind the sync module.
- Store tokens only in SecureStore; never AsyncStorage.
- Encrypt local data; delete it on logout.
- Every screen handles loading, empty, error, and offline states.
- Prefer lists with stable keys and virtualization.
- Do not block the UI thread with large computations.
- Use `NetInfo` for connectivity, but treat the server as authoritative.
- Request notification permission contextually.
- Test on a low-end Android device, not only an emulator.
- No PII in analytics or crash reports.
- Deep links validate inputs and require auth where needed.

## 12. Testing Standards

- Every bug fix includes a regression test.
- Domain logic has unit tests; repositories have integration tests.
- New tenant resources have isolation tests.
- Financial mutations have invariant and idempotency tests.
- New API endpoints have contract and auth tests.
- UI changes include a component or E2E test for the primary flow.
- No merging with failing tests; no skipped tests without a ticket.
- Test names describe behavior, not implementation.
- Tests are deterministic; no arbitrary sleeps.

## 13. Security Standards

- Validate and authorize every request server-side.
- Use parameterized queries and output encoding.
- Never commit secrets; use Secret Manager.
- Rotate any accidentally exposed secret immediately.
- Do not log sensitive data.
- Use `HttpOnly`, `Secure`, `SameSite` cookies.
- Escape CSV formula characters.
- Limit file types and sizes; scan uploads.
- Use signed URLs with short expiry.
- Keep dependencies patched; review advisories.
- Threat-model new integrations.
- Follow the vulnerability SLAs in [11-security-and-compliance.md](11-security-and-compliance.md).

## 14. Git and Review

### 14.1 Commits

Conventional Commits:

```
feat(fees): add partial payment allocation
fix(attendance): prevent duplicate offline sync
docs(adr): record Cloudflare routing decision
chore(deps): update drizzle-kit
```

### 14.2 Branches and PRs

- Branch from `main`; rebase before merge.
- PR size target: under 400 changed lines; split larger work.
- PR description: what, why, how tested, screenshots for UI, migration notes, rollback notes.
- Link the requirement ID or issue.
- At least one approval; two for auth, payments, payroll, security, and infrastructure.
- Authors do not merge their own PRs without a second reviewer.
- Review within one business day.
- Resolve conversations before merge.
- Squash merge; delete the branch.

### 14.3 Review checklist

- Correctness and edge cases
- Tenant isolation and authorization
- Money, rounding, and idempotency
- Error handling and user messaging
- Tests and coverage
- Performance and indexes
- Accessibility and localization
- Logging and observability
- Migration safety
- Security implications
- Documentation updated

## 15. Documentation

- Every module has a README: purpose, ownership, public interface, data, events, tests.
- ADRs for significant decisions.
- Runbooks for operational procedures.
- API docs generated from contracts.
- Update docs in the same PR as the code.
- No stale screenshots in critical setup guides.
- Use requirement IDs in PRs and tests for traceability.

## 16. Dependencies and Upgrades

- Justify new runtime dependencies in the PR.
- Prefer maintained libraries with a security policy.
- Check license compatibility.
- Pin versions; commit the lockfile.
- Group minor/patch upgrades weekly; major upgrades quarterly with a plan.
- Remove unused dependencies.
- No dependency for trivial helpers.

## 17. Feature Flags

- Every risky feature ships behind a flag defaulted off.
- Flags have an owner, description, and expiry.
- Test both flag states.
- Remove flags within 60 days of full rollout.
- Never use flags for authorization.

## 18. Performance Budgets

| Surface                     | Budget                 |
| --------------------------- | ---------------------- |
| Core API p95                | < 800ms                |
| Admin page LCP (4G)         | < 2.5s                 |
| Dashboard p95               | < 2s                   |
| Initial JS bundle per route | < 250KB gzipped        |
| Attendance marking          | < 60s per class        |
| Mobile cold start           | < 3s mid-range Android |
| PDF per report card         | < 2s average           |

Measure before optimizing. Add an index or cache only with evidence.

## 19. Definition of Done

See [12-testing-and-quality.md](12-testing-and-quality.md). A change is not done until it is tested, reviewed, deployed to staging, observed, and documented.

## 20. Related Documents

- [05-tech-stack.md](05-tech-stack.md)
- [09-api-contracts.md](09-api-contracts.md)
- [12-testing-and-quality.md](12-testing-and-quality.md)
- [21-ui-ux-guidelines.md](21-ui-ux-guidelines.md)
- [22-local-development.md](22-local-development.md)
