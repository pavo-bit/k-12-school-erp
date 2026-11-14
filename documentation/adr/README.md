# Architecture Decision Records

**Status:** Active  
**Owner:** Engineering  
**Related:** [../04-system-architecture.md](../04-system-architecture.md)

---

## What Is an ADR?

An Architecture Decision Record captures a significant technical decision, the context, the options considered, and the consequences. ADRs are immutable once accepted; a later decision supersedes an earlier one with a new ADR.

## Index

| ADR                                       | Title                                        | Status   |
| ----------------------------------------- | -------------------------------------------- | -------- |
| [0001](0001-modular-monolith.md)          | Use a modular monolith                       | Accepted |
| [0002](0002-shared-database-with-rls.md)  | Shared database with Row Level Security      | Accepted |
| [0003](0003-cloud-run.md)                 | Run workloads on Cloud Run                   | Accepted |
| [0004](0004-cloudflare-worker-routing.md) | Cloudflare Worker routing with origin secret | Accepted |
| [0005](0005-better-auth.md)               | Use Better Auth for authentication           | Accepted |
| [0006](0006-cloud-tasks-and-outbox.md)    | Cloud Tasks with a transactional outbox      | Accepted |
| [0007](0007-expo-single-codebase.md)      | One Expo codebase, two app variants          | Accepted |
| [0008](0008-offline-attendance-only.md)   | Offline attendance only                      | Accepted |
| [0009](0009-single-zone-cloud-sql.md)     | Single-zone Cloud SQL until 10 schools       | Accepted |
| [0010](0010-shared-project-staging.md)    | Staging in the production GCP project        | Accepted |
| [0011](0011-chromium-pdf-worker.md)       | Chromium PDF worker                          | Accepted |
| [0012](0012-rest-openapi.md)              | REST API with OpenAPI contracts              | Accepted |

## Status Values

- **Proposed:** under discussion.
- **Accepted:** in effect.
- **Superseded:** replaced by a later ADR.
- **Deprecated:** no longer recommended but still present.
- **Rejected:** considered and not adopted.

## Template

```markdown
# ADR-XXXX: Title

- **Status:** Proposed | Accepted | Superseded | Deprecated | Rejected
- **Date:** YYYY-MM-DD
- **Owner:** Name / role
- **Supersedes:** ADR-XXXX (if any)
- **Related:** links

## Context

What problem are we solving? What constraints matter?

## Decision

What we will do.

## Consequences

What becomes easier, harder, or newly required.

## Alternatives Considered

What else was evaluated and why it was not chosen.

## References

Links to docs, spikes, or vendor material.
```

## Conventions

- One decision per ADR.
- Record the decision when it is made, not months later.
- Include rejected alternatives; they prevent re-litigation.
- Update the index when adding an ADR.
- Do not rewrite accepted ADRs; supersede them.
- Architecture changes in code review must reference an ADR.
