---
name: Development
description: Use when writing or reviewing TypeScript, module code, services, repositories, RLS-aware queries, or refactoring in the monorepo.
---

# Development Skill

## Read first

- `documentation/20-engineering-standards.md`
- `documentation/04-system-architecture.md` sections 5 and 6
- `documentation/07-multi-tenancy-and-authorization.md`

## Rules

1. `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`; no `any`.
2. Return `Result<T, E>` for expected domain failures; throw only for unexpected errors.
3. Validate all external input with Zod at the boundary.
4. Never trust client-supplied `school_id`; derive it from auth context.
5. Other modules import only the module's `index.ts` public surface.
6. Repositories are private to their module; no cross-module table access.
7. Domain events are recorded in the outbox inside the same transaction as the state change.
8. Money is integer paise; dates are `timestamptz`; marks use `numeric`.
9. Use `SET LOCAL` for tenant context; never leak across pooled connections.
10. No `console.log` in application code; use the shared logger.
11. Keep transactions short; no external calls inside a transaction.
12. PR size target under 400 changed lines; conventional commits.

## Checklist before merging code changes

- [ ] Types pass (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Tests added or updated
- [ ] Tenant isolation considered
- [ ] Money, rounding, and idempotency reviewed
- [ ] Documentation updated in the same PR