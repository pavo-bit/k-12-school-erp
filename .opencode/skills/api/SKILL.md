---
name: API
description: Use when adding or changing REST endpoints, request/response contracts, idempotency, pagination, or webhook handlers.
---

# API Skill

## Read first

- `documentation/09-api-contracts.md`
- `documentation/20-engineering-standards.md` section 9

## Rules

1. Follow REST over HTTP with JSON payloads and standard status codes.
2. The school is derived from the authenticated context, never a request body.
3. Idempotency keys are required for payments, imports, payroll, and publishing.
4. Slow operations return `202` with a job ID.
5. Every response includes a request ID.
6. Validate input with Zod; infer types from schemas.
7. Additive changes only; no breaking changes inside a major version.
8. Use cursor pagination for large lists.
9. Enforce permissions in the service layer, not only the route.
10. Never trust `school_id` from the client.
11. Map domain errors to API responses in one place.
12. Document every endpoint in OpenAPI.
13. Webhooks verify signatures and use the gateway event ledger for idempotency.

## Checklist before merging API changes

- [ ] Zod schema defined and exported
- [ ] Auth and permission checks in service layer
- [ ] Idempotency where required
- [ ] Contract and auth tests added
- [ ] OpenAPI regenerated
- [ ] Error codes stable and documented
