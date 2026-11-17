# Observability and Operations

**Status:** Baseline  
**Owner:** Engineering / Operations  
**Related:** [06-aws-infrastructure.md](06-aws-infrastructure.md), [11-security-and-compliance.md](11-security-and-compliance.md), [13-cicd-and-release-management.md](13-cicd-and-release-management.md), [15-cost-model.md](15-cost-model.md)

---

## 1. Operating Model

The platform is operated by the founding team, not a separate NOC. The model must therefore be:

- **Low-noise:** few, actionable alerts.
- **Runbook-driven:** every recurring failure has a documented response.
- **Automated where possible:** restarts, retries, and scaling are managed services.
- **Transparent:** schools know about incidents that affect them.
- **Sustainable:** on-call rotation with recovery time, not permanent burnout.

## 2. Observability Pillars

| Pillar          | Tool                                               | Purpose                                       |
| --------------- | -------------------------------------------------- | --------------------------------------------- |
| Logs            | Cloud Logging                                      | Request, job, and error details               |
| Metrics         | Cloud Monitoring                                   | RED/USE metrics, business counters            |
| Traces          | OpenTelemetry (optional at GA)                     | Cross-service latency                         |
| Errors          | Sentry                                             | Exceptions, stack traces, release correlation |
| Uptime          | Cloud Monitoring uptime checks                     | External availability                         |
| Audit           | Postgres `audit_logs`                              | Business-sensitive actions                    |
| Provider status | Razorpay, Resend, MSG91, WhatsApp, GCP, Cloudflare | External dependencies                         |

## 3. Structured Logging

Every log line is JSON with:

```json
{
  "timestamp": "2027-06-14T09:14:02.123Z",
  "severity": "INFO",
  "message": "attendance.sync.applied",
  "request_id": "req_01J8Z3K4M5",
  "trace_id": "abc123",
  "school_id": "0192...",
  "user_id": "0192...",
  "route": "POST /api/v1/mobile/sync/attendance",
  "status": 200,
  "duration_ms": 184,
  "job_type": null,
  "job_id": null,
  "error_code": null
}
```

**Rules**

- Never log passwords, OTPs, tokens, card data, bank details, statutory IDs, or full request bodies for sensitive endpoints.
- Mask phone numbers and emails where they must appear.
- Include `school_id` and `request_id` on every request log.
- Use stable event names (`payment.webhook.received`, `report_card.batch.failed`).
- Log at the boundary and at state transitions, not on every function call.
- Sampling: 100% of errors and warnings; 10–20% of successful request logs if volume grows.
- Health check and static asset logs are excluded.

## 4. Key Metrics

### 4.1 Web and API (RED)

- Request rate by route and status
- Error rate (4xx, 5xx)
- p50/p95/p99 latency
- Auth success/failure rate
- Rate-limit hits
- Active sessions
- Tenant mismatch denials
- CSRF failures

### 4.2 Database (USE)

- CPU utilization
- Memory utilization
- Active connections vs limit
- Disk usage and growth
- Slow queries (`pg_stat_statements`)
- Lock waits and deadlocks
- Replication/PITR status
- Backup success

### 4.3 Jobs and queues

- Outbox pending age and count
- Cloud Tasks queue depth and age
- Job success/failure by type
- Retry count and exhaustion
- PDF render duration and memory
- Worker instance count and concurrency

### 4.4 Payments

- Orders created
- Payment success/failure/cancel rate
- Webhook received/processed/failed
- Webhook lag (event time to processing)
- Reconciliation exceptions
- Refund count and value

### 4.5 Communication

- Messages queued/sent/delivered/failed by channel
- Provider error rate and latency
- Opt-out rate
- Cost per school

### 4.6 Mobile

- Crash-free sessions
- ANR rate
- App version distribution
- Attendance sync success rate
- Payment funnel
- Push delivery and open rate

### 4.7 Business operations

- Daily active schools
- Attendance sections marked before cutoff
- Fee collection vs demand
- Outstanding dues
- Report cards pending generation
- Onboarding checklist completion

## 5. Dashboards

| Dashboard         | Audience            | Contents                                                           |
| ----------------- | ------------------- | ------------------------------------------------------------------ |
| Platform health   | Engineering         | Uptime, 5xx, latency, DB, queues, errors                           |
| Web/API           | Engineering         | Route-level RED metrics, auth, rate limits                         |
| Database          | Engineering         | CPU, connections, disk, slow queries, locks                        |
| Jobs              | Engineering         | Outbox, queues, retries, durations                                 |
| Payments          | Engineering/Finance | Success, webhook lag, reconciliation exceptions                    |
| Communication     | Engineering/Product | Delivery by channel, provider errors, cost                         |
| Mobile            | Product/Engineering | Crashes, sync, version, funnel                                     |
| School operations | Product/Support     | Attendance, collection, onboarding, tickets                        |
| Security          | Founders            | Failed logins, impersonations, export spikes, cross-tenant denials |

Dashboards are provisioned as code where practical and linked from the on-call runbook.

## 6. Service Level Objectives

| Service               | SLI                                | Beta SLO      | GA SLO         |
| --------------------- | ---------------------------------- | ------------- | -------------- |
| Web availability      | Successful requests / total        | 99.5% monthly | 99.9% after HA |
| API latency           | p95 for core endpoints             | < 800ms       | < 800ms        |
| Attendance sync       | Successful sync operations         | > 99%         | > 99.5%        |
| Payment webhook       | Processed within 60s               | > 99%         | > 99.5%        |
| Notification delivery | Delivered / attempted              | > 95%         | > 95%          |
| Report-card jobs      | Successful within 10 min per 1,000 | > 99%         | > 99.5%        |
| Backup restore        | Successful drill                   | Pass          | Pass           |

**Error budget policy**

- If a service consumes 50% of its monthly error budget, freeze risky changes to that service.
- At 100%, only reliability fixes and security patches deploy until the budget recovers.
- Budget exceptions require founder approval and a written rationale.

## 7. Alerting

### 7.1 P1 — page immediately

| Alert                  | Condition                                                      |
| ---------------------- | -------------------------------------------------------------- |
| Site/API down          | Uptime check fails 2 consecutive minutes                       |
| High 5xx               | > 5% for 5 minutes                                             |
| Database down          | Connection failures or instance unavailable                    |
| Cross-tenant signal    | Any RLS bypass or cross-tenant denial spike with data exposure |
| Duplicate charge risk  | Payment/refund inconsistency detected                          |
| Webhook failure spike  | > 10% failures over 10 minutes                                 |
| Queue backlog critical | Oldest pending > 30 minutes                                    |
| Disk critical          | > 90% or auto-resize nearing cap                               |
| Certificate expiry     | < 14 days                                                      |
| Auth outage            | Login success < 50% for 5 minutes                              |

### 7.2 P2 — ticket during business hours

- p95 latency > 1.5× baseline for 15 minutes
- Job failure rate > 5% for 30 minutes
- Provider error rate > 10% for 30 minutes
- DB CPU > 80% for 15 minutes
- Connections > 80% of limit
- Budget > 80%
- Staging deploy failure
- Mobile crash-free < 99%

### 7.3 Alert hygiene

- Every alert has an owner, runbook, severity, and threshold rationale.
- No alert without an action.
- Review alert noise monthly; delete or tune noisy alerts.
- Use multi-window conditions to avoid flapping.
- P1 alerts notify email and phone; P2 notify email/chat.
- On-call acknowledges P1 within 15 minutes.

## 8. On-Call

| Item         | Model                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Rotation     | Weekly among founders                                                                                    |
| Hours        | P1 24/7; P2 business hours (09:00–19:00 IST)                                                             |
| Handover     | Monday 10:00 IST with open incidents and risks                                                           |
| Escalation   | Primary → secondary → founder                                                                            |
| Compensation | Time off in lieu after a disruptive on-call week                                                         |
| Tools        | Cloud Monitoring, Sentry, status page, phone tree                                                        |
| Pager tool   | Start with Cloud Monitoring notification channels; adopt PagerDuty/Opsgenie only if noise justifies cost |

On-call responsibilities:

- Acknowledge and triage.
- Follow the runbook.
- Communicate status.
- Escalate early.
- Write or update the post-incident record.

## 9. Runbooks

Maintain short, tested runbooks in [`runbooks/`](runbooks/README.md) (individual runbooks created during Phase 1):

| Runbook                  | Trigger                       |
| ------------------------ | ----------------------------- |
| Deploy and rollback      | Release                       |
| Database restore         | Corruption or data loss       |
| Cross-tenant incident    | Suspected isolation failure   |
| Payment webhook backlog  | Lag or failures               |
| Duplicate payment/refund | Financial inconsistency       |
| Queue backlog            | Oldest job > threshold        |
| PDF generation failure   | Report cards/receipts failing |
| Auth outage              | Login failures                |
| Cloudflare/origin issue  | 403/521/522 errors            |
| Provider outage          | SMS/WhatsApp/email failures   |
| Database CPU/connections | Saturation                    |
| Disk full                | Storage alert                 |
| Secret rotation          | Scheduled or suspected leak   |
| School suspension        | Non-payment or policy         |
| Data deletion request    | DPDP request                  |
| Mobile release halt      | Crash regression              |
| Status page update       | School-facing incident        |

Each runbook includes: symptoms, impact, immediate actions, diagnostics, mitigation, escalation, and post-incident steps.

## 10. Backup and Restore Operations

| Item                      | Detail                                                                       |
| ------------------------- | ---------------------------------------------------------------------------- |
| Automated backup          | Daily, 30-day retention                                                      |
| PITR                      | 7 days                                                                       |
| Snapshot before migration | Manual, retained 7 days                                                      |
| Restore drill             | Before beta, before GA, then quarterly                                       |
| RPO                       | 15 minutes                                                                   |
| RTO                       | 4 hours pre-HA; 1 hour with HA target                                        |
| Verification              | Row counts, schema version, sample financial records, application smoke test |

**Restore drill steps**

1. Choose a backup/PITR timestamp.
2. Restore to a temporary instance.
3. Run schema version check.
4. Compare counts for students, invoices, payments, receipts, attendance, audit logs.
5. Verify a sample of invoice/receipt totals.
6. Start a staging app against the restored DB.
7. Run smoke tests.
8. Record duration and issues.
9. Delete the temporary instance.

## 11. Incident Management

### 11.1 Roles

| Role                | Responsibility                     |
| ------------------- | ---------------------------------- |
| Incident commander  | Coordinates, decides, communicates |
| Technical lead      | Diagnoses and fixes                |
| Communications lead | School updates and status page     |
| Scribe              | Timeline and actions               |

For small incidents, one person may hold multiple roles.

### 11.2 Process

1. **Declare** in the incident channel with severity and impact.
2. **Assign** roles.
3. **Stabilize** first; root cause later.
4. **Communicate** at a fixed cadence: P1 every 30 minutes, P2 every 2 hours.
5. **Resolve** and verify.
6. **Close** with a post-incident review within five working days.
7. **Track** action items to completion.

### 11.3 School communication

- Use the status page and school admin email/WhatsApp.
- State impact, start time, workaround, and next update.
- Do not speculate on cause or blame.
- For data incidents, coordinate with the privacy contact and school.

## 12. Maintenance

- Standard window: Sunday 01:00–04:00 IST.
- Notify schools 48 hours in advance for planned downtime.
- Prefer zero-downtime deploys; maintenance windows are for database upgrades and risky migrations.
- Freeze windows in `13-cicd-and-release-management.md` apply.
- Emergency maintenance follows the incident process.

## 13. Capacity Management

Review monthly:

| Metric              | Threshold          | Action                                  |
| ------------------- | ------------------ | --------------------------------------- |
| DB CPU              | > 60% sustained    | Optimize queries; consider tier upgrade |
| DB connections      | > 70%              | Tune pools; increase limit              |
| DB storage          | > 70%              | Archive; increase storage               |
| Web p95             | > 800ms            | Profile; scale; optimize                |
| Queue age           | > 5 minutes        | Scale workers; investigate              |
| PDF memory          | > 80%              | Reduce concurrency; increase memory     |
| Cloud Run instances | > 70% of max       | Raise max or optimize                   |
| Messaging cost      | > 80% of allowance | Review templates and opt-outs           |

At 10 schools, evaluate HA, read replicas, and dedicated staging database.

## 14. Support Operations

| Tier   | Owner                   | Scope                                                 |
| ------ | ----------------------- | ----------------------------------------------------- |
| Tier 0 | Help center, in-app FAQ | How-to, known issues                                  |
| Tier 1 | School admin            | User, class, and data corrections within their school |
| Tier 2 | Platform support        | Configuration, imports, bugs, billing                 |
| Tier 3 | Engineering             | Defects, incidents, data fixes                        |

- Support hours: 09:00–19:00 IST, Monday–Saturday during launch.
- P1 support 24/7 through the on-call rotation.
- Every ticket has a school, requester, severity, and request ID where possible.
- Data fixes require a documented script, approval, and audit.
- Support never asks for passwords or OTPs.
- Impersonation is time-bound and audited.

## 15. Status Page

- `status.erp.com` with components: Web, API, Parent app, Teacher app, Payments, Notifications, Report cards.
- Manual updates during incidents; automated checks can inform but not publish.
- Subscribe by email.
- Post-incident summary within 48 hours for P1/P2.

## 16. Business and Cost Monitoring

- Daily operations report: attendance completion, collection, failed payments, queue health.
- Weekly cost review: GCP, Cloudflare, messaging, Sentry.
- Monthly reconciliation: invoice vs gateway settlement vs bank.
- Monthly school health: active users, tickets, adoption, overdue dues.
- Alerts for unusual per-school messaging spend.

## 17. Related Documents

- [06-aws-infrastructure.md](06-aws-infrastructure.md)
- [11-security-and-compliance.md](11-security-and-compliance.md)
- [13-cicd-and-release-management.md](13-cicd-and-release-management.md)
- [15-cost-model.md](15-cost-model.md)
- [18-pilot-onboarding-and-migration.md](18-pilot-onboarding-and-migration.md)
