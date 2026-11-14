---
name: Testing
description: Use when adding or modifying unit, integration, RLS isolation, financial invariant, contract, E2E, mobile, or load tests.
---

# Testing Skill

## Read first

- `documentation/12-testing-and-quality.md`
- `documentation/20-engineering-standards.md` section 12

## Rules

1. Every bug fix includes a regression test.
2. Domain logic has unit tests; repositories have integration tests.
3. New tenant resources have isolation tests.
4. Financial mutations have invariant and idempotency tests.
5. New API endpoints have contract and auth tests.
6. UI changes include a component or E2E test for the primary flow.
7. Test names describe behavior, not implementation.
8. Tests are deterministic; no arbitrary sleeps.
9. No merging with failing tests; no skipped tests without a ticket.
10. Integration tests run against real PostgreSQL, not pg-mem.
11. RLS tests prove cross-tenant reads, writes, exports, and job isolation.
12. Mobile tests include the offline attendance matrix on low-end Android.

## Checklist before merging test changes

- [ ] Tests pass locally (`pnpm test`, `pnpm test:integration`)
- [ ] New tenant resources have isolation tests
- [ ] Financial mutations have invariant tests
- [ ] No flaky or non-deterministic tests
