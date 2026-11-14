---
name: DevOps
description: Use when changing Docker, CI/CD, Terraform, Cloud Run, Cloud SQL, Cloudflare, monitoring, secrets, or deployment workflows.
---

# DevOps Skill

## Read first

- `documentation/06-gcp-infrastructure.md`
- `documentation/13-cicd-and-release-management.md`
- `documentation/14-observability-and-operations.md`
- `documentation/15-cost-model.md`

## Rules

1. Infrastructure changes go through Terraform in `infra/terraform/`; no manual console changes in production.
2. Cloud Run services keep the documented concurrency and instance limits.
3. Workers and PDF workers scale to zero; only web keeps a warm instance.
4. Secrets live in Secret Manager and are never committed; reference them in Cloud Run.
5. Migrations run as `erp_migrations`, never as the runtime role.
6. Production migrations take a pre-migration snapshot and have a documented roll-forward plan.
7. CI must pass typecheck, lint, unit, integration, build, and migration-from-empty tests.
8. Docker images are multi-stage, non-root, with a healthcheck.
9. Budget alerts stay at 50%, 80%, 100%, and 120% of the monthly budget.
10. Cloudflare Worker validates the origin secret and blocks direct origin access.
11. Observability: structured JSON logs, request ID, school ID, user ID; Sentry for errors.
12. Never connect to `erp_prod` from a laptop without written approval.

## Checklist before merging infra changes

- [ ] Terraform plan reviewed
- [ ] Rollback/roll-forward documented
- [ ] Budget impact noted
- [ ] Secrets and IAM scoped to least privilege
- [ ] Staging tested before production