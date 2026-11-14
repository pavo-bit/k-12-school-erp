# ADR-0012: REST API with OpenAPI Contracts

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../09-api-contracts.md](../09-api-contracts.md), [../10-mobile-application.md](../10-mobile-application.md)

---

## Context

The web app, mobile apps, workers, and future integrations need a stable API. The team is small and values explicit contracts, generated types, clear errors, and predictable caching. The mobile apps are released to app stores and cannot always upgrade in lockstep with the backend.

GraphQL would offer flexible queries but adds schema, resolver, caching, and authorization complexity. tRPC would be fast for TypeScript clients but couples mobile releases tightly and is less friendly to external integrations or webhooks.

## Decision

Use a **versioned REST API** under `/api/v1`:

- JSON request and response bodies.
- Zod schemas as the source of truth.
- OpenAPI 3.1 generated from schemas and route metadata.
- Generated TypeScript types and a typed fetch client for web and mobile.
- Cursor pagination, explicit filters, and stable error codes.
- `Idempotency-Key` for financial and bulk mutations.
- Webhooks with signature verification and event deduplication.
- Additive changes only within a major version; breaking changes require `/v2`.
- Mobile minimum-version enforcement for contract changes.

## Consequences

**Easier**

- Clear, cacheable, debuggable HTTP semantics.
- Typed clients and contract tests.
- External integrations and webhooks fit naturally.
- Mobile can evolve independently within a major version.
- Standard tooling for docs, monitoring, and gateways.

**Harder**

- Multiple round trips for complex screens; need purpose-built endpoints.
- Versioning discipline is required.
- Over-fetching/under-fetching compared with GraphQL.
- Schema drift must be prevented in CI.

**New requirements**

- OpenAPI generation and drift checks.
- Contract tests for mobile and web.
- Error code catalog and documentation.
- Deprecation policy and sunset headers.
- Idempotency storage and cleanup.
- API review for new endpoints.

## Alternatives Considered

| Alternative      | Why not                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| GraphQL          | More moving parts and authorization complexity; not needed for known client surfaces     |
| tRPC             | Tight coupling to TypeScript clients and app versions; weaker external integration story |
| gRPC             | Excellent for internal services, but browser/mobile support and tooling add friction     |
| Unversioned REST | Breaks mobile clients and integrations over time                                         |

## References

- [09-api-contracts.md](../09-api-contracts.md)
- [10-mobile-application.md](../10-mobile-application.md)
- [20-engineering-standards.md](../20-engineering-standards.md)
