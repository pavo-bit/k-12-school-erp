# ADR-0001: Use a Modular Monolith

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../04-system-architecture.md](../04-system-architecture.md), [../20-engineering-standards.md](../20-engineering-standards.md)

---

## Context

The product spans platform, students, admissions, attendance, fees, exams, HR/payroll, communication, and reporting. The initial team is three founders plus one mobile engineer and one QA engineer. The operational budget is tight, and the team must support production without a platform team.

Microservices would multiply deployments, contracts, observability, and failure modes. A single unstructured codebase would make boundaries unclear and allow cross-module coupling that becomes expensive to unwind.

## Decision

Build a **modular monolith** in a TypeScript monorepo, deployed as three containers:

- `web`: Next.js UI and REST API
- `worker`: background jobs
- `pdf-worker`: Chromium PDF rendering

Modules are strict internal packages with a public service interface. They own their tables and expose typed DTOs. Cross-module communication uses service calls or domain events; modules do not import each other’s repositories.

## Consequences

**Easier**

- One deployment pipeline, one database, one transaction boundary.
- Simple local development and debugging.
- Shared types and validation across web, workers, and mobile.
- Lower infrastructure and operational cost.
- Refactoring across modules is possible without network contracts.

**Harder**

- Module boundaries require discipline and automated enforcement.
- One bad deploy affects all modules.
- Scaling is coarse-grained; the whole web app scales together.
- A shared database can become a coupling point if reporting bypasses module boundaries.

**New requirements**

- Boundary lint rules and code review.
- Module READMEs and ownership.
- A path to extract a service if a module needs independent scaling or isolation.
- Feature flags for risky cross-module changes.

## Alternatives Considered

| Alternative                                         | Why not                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Microservices from day one                          | Operational overhead exceeds team capacity; distributed transactions and debugging would slow delivery |
| Single unstructured Next.js app                     | Fast initially, but boundaries erode and reporting/auth logic becomes tangled                          |
| Serverless functions per endpoint                   | Fragmented deploys, cold starts, and shared logic duplication                                          |
| Modular monolith with separate databases per module | Adds cross-database consistency problems without a present need                                        |

## References

- [04-system-architecture.md](../04-system-architecture.md)
- [20-engineering-standards.md](../20-engineering-standards.md)
