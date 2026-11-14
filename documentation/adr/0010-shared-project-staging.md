# ADR-0010: Staging in the Production GCP Project

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../06-gcp-infrastructure.md](../06-gcp-infrastructure.md), [../11-security-and-compliance.md](../11-security-and-compliance.md)

---

## Context

The team needs a staging environment for integration, UAT, demos, and migration rehearsals. A separate GCP project with its own Cloud SQL instance adds ₹6,000–9,000+ per month and duplicates IAM, billing, quotas, and Terraform setup. The launch budget is tight. At the same time, staging must not touch production data or services.

## Decision

Run **staging in the production GCP project** with strict resource and identity separation:

| Resource         | Production   | Staging                            |
| ---------------- | ------------ | ---------------------------------- |
| Cloud Run        | `*-prod`     | `*-staging`                        |
| Database         | `erp_prod`   | `erp_staging` on the same instance |
| DB user          | `erp_app`    | `erp_staging_app`                  |
| Buckets          | `erp-prod-*` | `erp-staging-*`                    |
| Queues           | `*-prod`     | `*-staging`                        |
| Secrets          | `*-prod`     | `*-staging`                        |
| Service accounts | `sa-*-prod`  | `sa-*-staging`                     |
| Payments         | Live keys    | Test keys                          |

Guardrails:

- Staging runtime service accounts have no access to production secrets, buckets, or databases.
- Staging cannot invoke production queues or jobs.
- Terraform separates environments and requires approval for production applies.
- Staging uses synthetic or anonymized data only.
- SMS/WhatsApp disabled or sandboxed; email allowlisted.
- Staging database has smaller connection and statement limits.

Move staging to a separate project when 10+ schools, a customer security requirement, or a compliance audit requires it.

## Consequences

**Easier**

- Low incremental cost.
- One billing account and quota view.
- Shared VPC and private services access.
- Simple network path and IAM model.
- Fast environment setup.

**Harder**

- Blast radius from a misconfigured IAM policy or Terraform apply.
- Shared quotas and database instance resources.
- A production incident could affect staging and vice versa.
- Access control must be precise.
- Security reviews must verify no cross-environment paths.

**New requirements**

- Environment-specific service accounts and secrets.
- IAM tests that staging cannot read production secrets.
- Terraform approval gates and drift detection.
- Dataset labeling and cleanup.
- Separation review at 10 schools.
- No production data copied to staging without anonymization approval.

## Alternatives Considered

| Alternative                       | Why not                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- |
| Separate GCP project from day one | Better isolation but adds ₹6–9k+/month and duplicated setup before revenue |
| No staging environment            | Unacceptable for migrations, payments, and UAT                             |
| Ephemeral preview environments    | Useful later, but not a substitute for persistent UAT                      |
| Staging on a developer machine    | Does not mirror routing, IAM, or cloud services                            |

## References

- [06-gcp-infrastructure.md](../06-gcp-infrastructure.md)
- [11-security-and-compliance.md](../11-security-and-compliance.md)
