# ADR-0009: Single-Zone Cloud SQL Until 10 Schools

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../06-gcp-infrastructure.md](../06-gcp-infrastructure.md), [../15-cost-model.md](../15-cost-model.md), [../19-risk-register.md](../19-risk-register.md)

---

## Context

Cloud SQL high availability roughly doubles database cost. At launch, the target is 5–10 schools and a monthly GCP/vendor budget of ₹15–30k. The database is the largest fixed cost. A zonal failure would cause downtime, but the business can tolerate a measured recovery window during the pilot if backups and restores are proven.

Schools depend on attendance and fee collection, but the first pilot can use paper fallback for attendance during a short outage.

## Decision

Run **Cloud SQL PostgreSQL in a single zone** at launch:

- 1 vCPU / 3.75 GB, 50 GB SSD, auto-resize.
- Daily backups with 30-day retention.
- 7-day point-in-time recovery.
- Pre-migration snapshots.
- Restore drills before beta and GA, then quarterly.
- Documented RPO 15 minutes and RTO 4 hours.

Move to **HA (regional)** at 10 paying schools, a contractual 99.9% requirement, or a demonstrated reliability need—whichever comes first. Budget approval is required before the change.

## Consequences

**Easier**

- Saves roughly ₹8,000–15,000 per month at launch.
- Simpler capacity and cost planning.
- Adequate for pilot scale with tested restores.

**Harder**

- A zonal outage causes downtime until recovery.
- RTO depends on restore speed and operational readiness.
- Schools may perceive the platform as less resilient.
- HA migration needs a maintenance window and testing.

**New requirements**

- Restore drills with recorded duration.
- Monitoring for zone health, storage, CPU, and connections.
- A clear incident runbook and school communication plan.
- A written HA trigger and budget approval.
- Avoid promises of 99.9% uptime before HA.

## Alternatives Considered

| Alternative             | Why not                                                      |
| ----------------------- | ------------------------------------------------------------ |
| HA from day one         | Adds ₹8–15k/month before revenue; exceeds early budget       |
| Self-managed PostgreSQL | More operational risk and effort; not viable for the team    |
| AlloyDB                 | Higher cost and complexity than needed at this scale         |
| Database-per-school     | Cost and migration overhead; does not solve zonal resilience |

## References

- [06-gcp-infrastructure.md](../06-gcp-infrastructure.md)
- [15-cost-model.md](../15-cost-model.md)
- [19-risk-register.md](../19-risk-register.md)
