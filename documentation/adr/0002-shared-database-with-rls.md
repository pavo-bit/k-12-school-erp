# ADR-0002: Shared Database with Row Level Security

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../07-multi-tenancy-and-authorization.md](../07-multi-tenancy-and-authorization.md), [../08-data-model.md](../08-data-model.md)

---

## Context

The platform must isolate 20–50 schools while keeping cost and operational overhead low. Options included database-per-tenant, schema-per-tenant, and a shared schema with a tenant key. Migrations, connection pooling, cross-school reporting for trusts, and per-school retention all matter.

The team is small and cannot operate a fleet of databases. The most sensitive risk is cross-tenant data access.

## Decision

Use a **shared PostgreSQL database and shared schema**. Every tenant-owned table has `school_id uuid NOT NULL`. PostgreSQL Row Level Security is enabled and forced, with policies based on `current_setting('app.current_school_id')`. The runtime role is subject to RLS; migrations run as a separate role.

Application code sets tenant context per transaction with `SET LOCAL`. The server derives the school from the authenticated session or resource ownership, never from a client-supplied `school_id`. Tenant isolation tests run on every pull request.

## Consequences

**Easier**

- One database, one migration path, one backup policy, one connection pool.
- Low cost at the target scale.
- Cross-branch reporting for organizations is possible with explicit policies.
- RLS provides defense in depth beyond application checks.
- Adding a school is a row insert, not infrastructure.

**Harder**

- A missing `school_id` or policy is a serious defect.
- Per-school restore and export require logical tooling.
- Noisy neighbors share resources.
- Schema changes affect all tenants at once.
- RLS debugging can be subtle.

**New requirements**

- Metadata test that every table with `school_id` has RLS enabled and forced.
- Isolation suite covering read, write, list, export, and jobs.
- Indexes lead with `school_id`.
- Composite foreign keys prevent cross-tenant references.
- Query review for raw SQL and reporting.
- Per-school rate limits and slow-query monitoring.

## Alternatives Considered

| Alternative                       | Why not                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| Database per school               | Migration fan-out, connection overhead, higher cost, harder cross-school reporting |
| Schema per school                 | Tooling complexity, migration fan-out, connection/schema limits                    |
| Application-only tenant filtering | One missed filter becomes a breach; no defense in depth                            |
| Separate deployment per school    | Operational cost and slow onboarding; not viable for 20–50 schools                 |

## References

- [07-multi-tenancy-and-authorization.md](../07-multi-tenancy-and-authorization.md)
- [08-data-model.md](../08-data-model.md)
- [12-testing-and-quality.md](../12-testing-and-quality.md)
