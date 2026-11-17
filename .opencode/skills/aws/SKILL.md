---
name: AWS
description: Use when changing AWS infrastructure, Lambda, Aurora, S3, SQS, CloudFront, Route53, Secrets Manager, or deployment workflows.
---

# AWS Skill

## Read first

- `documentation/06-aws-infrastructure.md`
- `documentation/13-cicd-and-release-management.md`
- `documentation/15-cost-model.md`

## Rules

1. Use Aurora Serverless v2 for the database; scale capacity units based on load.
2. Use RDS Proxy for Lambda connection pooling; never connect Lambda directly to Aurora at scale.
3. Use S3 for all object storage; signed URLs with short expiry for private files.
4. Use SQS for async jobs; Lambda triggers with batch processing and DLQ.
5. Use EventBridge Scheduler for cron jobs; not Lambda self-scheduling.
6. Use CloudFront for CDN and edge routing; Lambda@Edge for tenant resolution if needed.
7. Use Secrets Manager for secrets; never commit them; use IAM roles for service access.
8. Use OpenNext for Next.js deployment to Lambda + CloudFront.
9. Use CDK or Terraform for IaC; all infra changes through code.
10. Use OIDC for GitHub Actions; no long-lived AWS credentials.
11. Monitor with CloudWatch; set alarms for errors, latency, DB connections, queue depth.
12. Use Aurora read replicas for reporting queries at scale.

## Checklist before merging AWS infra changes

- [ ] Terraform/CDK plan reviewed
- [ ] IAM least privilege verified
- [ ] Secrets in Secrets Manager, not env files
- [ ] RDS Proxy configured for Lambda
- [ ] DLQ configured for SQS
- [ ] CloudWatch alarms set
- [ ] Staging tested before production
