---
name: Database
description: Use when changing PostgreSQL schema, migrations, RLS policies, indexes, constraints, or seed data.
---

# Database Skill

## Read first

- `documentation/08-data-model.md`
- `documentation/07-multi-tenancy-and-authorization.md` sections 4 and 8
- `documentation/20-engineering-standards.md` section 8

## Rules

1. Every tenant table has `school_id uuid not null`, RLS enabled and forced, and an index leading with `school_id`.
2. Migrations that create a tenant table add RLS in the same file.
3. Use `timestamptz`, never `timestamp`.
4. Store money as `bigint` paise; marks and percentages as `numeric`.
5. Prefer `text` + `CHECK` over native enums.
6. Foreign keys are explicit with `ON DELETE RESTRICT` by default.
7. Use composite foreign keys including `school_id` where cross-tenant references are possible.
8. Transactions for multi-row invariants; no external calls inside a transaction.
9. Migrations are immutable after merge; fix forward with a new migration.
10. Use `CONCURRENTLY` for large indexes; review lock impact.
11. Expand/contract: add nullable columns or new tables, backfill, switch, then remove later.
12. Never hard-delete financial or academic records; soft-archive.
13. `audit_logs` is append-only; no `UPDATE` or `DELETE` for the app role.

## Checklist before merging schema changes

- [ ] Migration runs from an empty database
- [ ] Migration runs from a production-like snapshot
- [ ] RLS policy present and tested
- [ ] Indexes added for known query paths only
- [ ] Roll-forward plan documented
- [ ] Seed data updated if reference data changed