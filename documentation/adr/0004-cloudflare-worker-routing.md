# ADR-0004: Cloudflare Worker Routing with Origin Secret

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../06-gcp-infrastructure.md](../06-gcp-infrastructure.md), [../11-security-and-compliance.md](../11-security-and-compliance.md)

---

## Context

Each school needs its own address, e.g. `{school}.erp.com`. The platform needs wildcard TLS, DNS, WAF, and low cost. A GCP external load balancer with a managed certificate and Cloud Armor adds fixed monthly cost and configuration overhead. Cloud Run provides a public URL per service but does not provide wildcard custom-domain routing by itself.

The direct Cloud Run URL must not become an unauthenticated bypass around edge protections.

## Decision

Use **Cloudflare** for DNS, TLS, WAF, and edge routing. A Cloudflare Worker handles wildcard subdomains and proxies to Cloud Run:

- Resolve `{school}.erp.com` to the tenant slug.
- Inject `X-Tenant-Host` and `X-Origin-Secret`.
- Strip client-supplied versions of those headers.
- Forward to the Cloud Run web URL.
- Reject unknown or malformed hosts.
- Route `api.erp.com` and staging hosts separately.

The application rejects any request without the correct secret, using a constant-time comparison. The secret is stored in Secret Manager and Cloudflare, rotated quarterly. Direct Cloud Run URLs are tested and must return `403`.

## Consequences

**Easier**

- Wildcard TLS and DNS at low cost.
- WAF, bot protection, and caching at the edge.
- No GCP load balancer or managed certificate.
- Fast tenant routing changes without app deploy.

**Harder**

- Cloudflare Worker becomes a critical path.
- Two places store the origin secret; rotation must be coordinated.
- Cloudflare free-plan limits may require an upgrade.
- Debugging spans Cloudflare and Cloud Run.
- An emergency bypass requires a documented procedure.

**New requirements**

- Worker unit tests and staging verification.
- Direct-origin rejection tests in CI.
- Secret rotation runbook.
- Cloudflare analytics and limit monitoring.
- Host header validation and request ID propagation.
- A plan to move to a GCP load balancer with Cloud Armor if requirements change.

## Alternatives Considered

| Alternative                                          | Why not                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| GCP external Application Load Balancer + Cloud Armor | Fixed cost and more configuration; Cloudflare already provides DNS/WAF        |
| Wildcard DNS directly to Cloud Run                   | Cloud Run domain mapping does not support wildcard per-tenant routing cleanly |
| Cloudflare for SaaS custom hostnames                 | More complexity and cost than needed at launch                                |
| One Cloud Run service per school                     | Operational overhead and poor isolation economics                             |

## References

- [06-gcp-infrastructure.md](../06-gcp-infrastructure.md)
- [11-security-and-compliance.md](../11-security-and-compliance.md)
