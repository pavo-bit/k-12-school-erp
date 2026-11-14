# Runbooks

**Status:** Index; individual runbooks created in Phase 1  
**Owner:** Engineering / Operations  
**Related:** [../14-observability-and-operations.md](../14-observability-and-operations.md), [../13-cicd-and-release-management.md](../13-cicd-and-release-management.md)

---

## 1. Purpose

Runbooks are short, tested procedures for responding to operational events. They are written for a tired engineer at 2 a.m., not for a design review. They assume the reader knows the system but not the specific failure.

## 2. When to Write a Runbook

- Before a feature with a new failure mode reaches production.
- After any P1/P2 incident.
- When an alert is created.
- When a manual operational task recurs.
- Before beta and GA readiness reviews.

## 3. Planned Runbooks

| Runbook                     | Trigger                                 | Owner           | Status  |
| --------------------------- | --------------------------------------- | --------------- | ------- |
| Deploy and rollback         | Release or failed canary                | Founder 1       | Planned |
| Database restore            | Corruption, data loss, failed migration | Founder 1       | Planned |
| Cross-tenant incident       | Suspected isolation failure             | Founder 1       | Planned |
| Payment webhook backlog     | Lag or failures                         | Founder 1       | Planned |
| Duplicate payment or refund | Financial inconsistency                 | Founder 1       | Planned |
| Queue backlog               | Oldest job above threshold              | Founder 1       | Planned |
| PDF generation failure      | Report cards or receipts failing        | Founder 1       | Planned |
| Auth outage                 | Login or OTP failures                   | Founder 1       | Planned |
| Cloudflare or origin issue  | 403/521/522 errors                      | Founder 1       | Planned |
| Provider outage             | SMS, WhatsApp, email, push failures     | Founder 2       | Planned |
| Database CPU or connections | Saturation alerts                       | Founder 1       | Planned |
| Disk full                   | Storage alert                           | Founder 1       | Planned |
| Secret rotation             | Scheduled or suspected leak             | Founder 1       | Planned |
| School suspension           | Non-payment or policy violation         | Founder 2       | Planned |
| Data deletion request       | DPDP request                            | Founder 2       | Planned |
| Mobile release halt         | Crash or sync regression                | Mobile engineer | Planned |
| Status page update          | School-facing incident                  | Founder 3       | Planned |

## 4. Runbook Template

```markdown
# Runbook: Title

- **Owner:**
- **Severity:**
- **Last tested:**
- **Related alerts:**

## Symptoms

What the on-call sees.

## Impact

Who is affected and how.

## Immediate actions

1. Confirm the issue.
2. Stabilize or contain.
3. Communicate.

## Diagnosis

Commands, dashboards, logs, and queries.

## Mitigation

Step-by-step fix or workaround.

## Escalation

Who to call and when.

## Recovery verification

How to confirm the system is healthy.

## Post-incident

What to record and review.

## Rollback

How to undo the change if needed.
```

## 5. Standards

- Every runbook has an owner and a last-tested date.
- Commands are copy-pasteable and safe by default.
- Dangerous commands include a warning and a dry-run alternative.
- Links point to dashboards, logs, and related ADRs.
- No secrets or production credentials in the text.
- Runbooks are tested during drills, not during the incident.
- Update the runbook within five working days of an incident that used it.

## 6. Escalation

| Severity | Acknowledge       | Escalate                                                   |
| -------- | ----------------- | ---------------------------------------------------------- |
| P1       | 15 minutes        | Incident commander immediately; founders within 30 minutes |
| P2       | 1 hour            | Engineering lead within 2 hours                            |
| P3       | Next business day | Team lead if unresolved in 2 days                          |
| P4       | Backlog           | None                                                       |

See [../14-observability-and-operations.md](../14-observability-and-operations.md) for alert definitions and incident roles.

## 7. Maintenance

- Review the index monthly.
- Add a runbook for every new P1/P2 alert.
- Retire runbooks for removed features.
- Verify links and commands after major releases.
- Record drill results and gaps.
