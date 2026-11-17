# ADR-0003: Run Workloads on Cloud Run

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../06-aws-infrastructure.md](../06-aws-infrastructure.md), [../15-cost-model.md](../15-cost-model.md)

---

## Context

The application needs containerized web, API, background worker, and PDF rendering workloads in Mumbai. The team has no Kubernetes operations capacity. Traffic is seasonal and peaks around attendance hours, fee due dates, and results publication. Cost must stay within ₹15–30k/month at launch.

## Decision

Deploy all runtime workloads to **Cloud Run** in `asia-south1`:

| Service      | Scaling                     |
| ------------ | --------------------------- |
| `web`        | Min 1 warm instance, max 10 |
| `worker`     | Min 0, max 10               |
| `pdf-worker` | Min 0, max 5, memory-heavy  |

Use Cloud SQL connectors/Direct VPC egress, Secret Manager, Cloud Tasks, and Cloud Scheduler. Keep containers portable and avoid proprietary runtime APIs beyond managed infrastructure.

## Consequences

**Easier**

- No cluster to operate or upgrade.
- Scale to zero for workers and PDF.
- Revision-based deploys, traffic splitting, and rollback.
- Concurrency-based autoscaling fits HTTP workloads.
- Simple IAM and per-service identity.

**Harder**

- Cold starts for workers and PDF; the web service pays for one warm instance.
- Request timeout limits (60s web, 900s jobs).
- No persistent local disk; use GCS.
- CPU allocation must be understood: always-on for web, allocated for workers/PDF.
- Long-running jobs must be chunked.
- Some networking features require Direct VPC egress.

**New requirements**

- Health and readiness endpoints.
- Graceful shutdown handling.
- Idempotent job handlers.
- Cloud Run max-instance caps to control cost.
- Startup CPU boost for web.
- Monitoring of cold starts, instance count, and queue age.

## Alternatives Considered

| Alternative                         | Why not                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| GKE                                 | Operational overhead and cost exceed the team’s capacity |
| App Engine                          | Less container flexibility; runtime constraints          |
| Compute Engine VMs                  | Patching, scaling, and HA become manual                  |
| Cloud Functions                     | Poor fit for Next.js and Chromium PDF; fragmented logic  |
| Cloud Run alone without Cloud Tasks | No durable retries/queueing for background work          |

## References

- [06-aws-infrastructure.md](../06-aws-infrastructure.md)
- [15-cost-model.md](../15-cost-model.md)
