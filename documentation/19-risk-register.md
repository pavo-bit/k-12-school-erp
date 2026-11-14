# Risk Register

**Status:** Baseline  
**Owner:** Founders  
**Review:** Weekly during delivery; monthly after GA  
**Related:** [11-security-and-compliance.md](11-security-and-compliance.md), [16-delivery-roadmap.md](16-delivery-roadmap.md), [17-team-and-hiring-plan.md](17-team-and-hiring-plan.md), [18-pilot-onboarding-and-migration.md](18-pilot-onboarding-and-migration.md)

---

## 1. Method

**Score = Likelihood × Impact**

| Likelihood | Definition     |
| ---------- | -------------- |
| 1          | Rare           |
| 2          | Unlikely       |
| 3          | Possible       |
| 4          | Likely         |
| 5          | Almost certain |

| Impact | Definition                                             |
| ------ | ------------------------------------------------------ |
| 1      | Negligible                                             |
| 2      | Minor delay or inconvenience                           |
| 3      | Material delay, cost, or school dissatisfaction        |
| 4      | Major delivery, financial, or reputational damage      |
| 5      | Existential: data breach, insolvency, or loss of pilot |

| Score | Rating   | Response                                                 |
| ----- | -------- | -------------------------------------------------------- |
| 15–25 | Critical | Immediate action; founder-level ownership; weekly review |
| 10–14 | High     | Mitigation plan with dates; weekly review                |
| 5–9   | Medium   | Monitor; mitigation when triggered                       |
| 1–4   | Low      | Accept or monitor quarterly                              |

## 2. Top Risks

| Rank | Risk                                          | Score | ID   |
| ---- | --------------------------------------------- | ----- | ---- |
| 1    | Cross-tenant data exposure                    | 16    | T-01 |
| 2    | Mobile engineer hiring delay                  | 16    | D-01 |
| 3    | Key-person dependency on Founder 1            | 16    | D-03 |
| 4    | Scope creep beyond beta/GA                    | 15    | P-01 |
| 5    | Pilot data quality and migration mismatch     | 15    | P-02 |
| 6    | Payment duplication or reconciliation failure | 15    | T-03 |
| 7    | Payroll calculation defect                    | 15    | T-07 |
| 8    | Secret leakage in repo or logs                | 15    | T-10 |
| 9    | DPDP compliance gap                           | 15    | V-05 |
| 10   | Fewer than 5 paying schools by October 2027   | 15    | B-01 |
| 11   | Renewals fail in 2028                         | 15    | B-08 |

Risks scoring 12 or below are tracked in the section tables below. Scores are reviewed weekly; the founders break ties by potential severity.

## 3. Delivery and Team

| ID   | Risk                                                               | L   | I   | Score | Owner    | Mitigation                                                                                           | Early warning                                         |
| ---- | ------------------------------------------------------------------ | --- | --- | ----- | -------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| D-01 | Mobile engineer not hired by January 2027                          | 4   | 4   | 16    | Founders | Start sourcing in November; referral bonus; paid work sample; move beta date if unfilled by February | Fewer than 3 qualified candidates by mid-December     |
| D-02 | QA engineer not hired by February 2027                             | 3   | 4   | 12    | Founders | Parallel sourcing; founders cover critical suites; reduce beta scope                                 | No offer by end January                               |
| D-03 | Key-person dependency on Founder 1 for infrastructure and payments | 4   | 4   | 16    | Founders | Document runbooks; pair on deploys; give Founder 2 production access and restore training            | Only one person can deploy or restore                 |
| D-04 | Founder burnout during alpha/beta                                  | 3   | 4   | 12    | Founders | Protect focus time; cut scope; hire at triggers; track consecutive weekends                          | Missed standups, rising sick days, decision delays    |
| D-05 | Onboarding new hires slows delivery                                | 3   | 3   | 9     | Founders | Start early; buddy system; scoped first tasks; 30/60/90 plan                                         | New hire without a merged change in first three weeks |
| D-06 | Underestimated effort in exams and report cards                    | 4   | 3   | 12    | Product  | Golden tests early; pilot template samples; dedicate Phase 4; cut analytics if needed                | Marks entry still unstarted by July                   |
| D-07 | Academic calendar shift changes beta timing                        | 2   | 4   | 8     | Product  | Confirm calendars in LOIs; design for any start month; avoid hard-coded dates                        | Pilot announces calendar change                       |
| D-08 | Hiring costs exceed budget                                         | 3   | 3   | 9     | Founders | Benchmark early; use ESOP; phase hires by trigger                                                    | Offers above band                                     |

## 4. Product and Scope

| ID   | Risk                                                 | L   | I   | Score | Owner          | Mitigation                                                                           | Early warning                                     |
| ---- | ---------------------------------------------------- | --- | --- | ----- | -------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| P-01 | Scope creep from pilot requests                      | 5   | 3   | 15    | Product        | Written scope freeze; change control; post-GA backlog; say no with alternatives      | More than 3 enhancement requests per week         |
| P-02 | Pilot data quality causes repeated import failures   | 5   | 3   | 15    | Implementation | Templates, validation, dry runs, named data owner, reconciliation sign-off           | Error rate above 10% after second dry run         |
| P-03 | Report-card templates differ significantly by school | 4   | 3   | 12    | Product        | Collect samples early; support 2–3 configurable templates; no per-school code        | New template request after Phase 4 starts         |
| P-04 | Payroll rules vary and are poorly documented         | 4   | 3   | 12    | Product        | CA review; configurable components; golden fixtures; export-only scope               | CA unavailable or components unclear by April     |
| P-05 | Low parent app adoption                              | 3   | 4   | 12    | Product        | School communication, QR posters, WhatsApp onboarding, simple OTP flow, support desk | Activation below 30% after two weeks              |
| P-06 | Teacher resistance to digital attendance             | 3   | 4   | 12    | Product        | Under-60-second flow, offline support, training, principal mandate, super users      | Sections not marked by 10:00                      |
| P-07 | School demands per-school customizations             | 4   | 3   | 12    | Founders       | Configuration-first policy; pricing for custom work; roadmap governance              | “Just for us” requests in UAT                     |
| P-08 | Fees/payments scope expands into full accounting     | 3   | 3   | 9     | Product        | Explicit non-goal; export to Tally post-GA; refer to accountant                      | Requests for ledgers, journal entries, GST filing |
| P-09 | Admissions module overbuilt                          | 3   | 3   | 9     | Product        | Lean pipeline at GA; no entrance tests or merit lists                                | CRM feature requests before GA                    |
| P-10 | Localization quality is poor                         | 3   | 3   | 9     | Design         | Native review; pseudo-locale tests; glossary; PDF font tests                         | Truncated or machine-sounding strings in UAT      |

## 5. Technical and Security

| ID   | Risk                                                    | L   | I   | Score | Owner              | Mitigation                                                                            | Early warning                                              |
| ---- | ------------------------------------------------------- | --- | --- | ----- | ------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| T-01 | Cross-tenant data exposure through missing scope or RLS | 4   | 4   | 16    | Founder 1          | RLS forced; tenant context mandatory; metadata tests; isolation suite in CI; pen test | Any query without school context; new table without policy |
| T-02 | Cloudflare origin bypass exposes Cloud Run directly     | 3   | 4   | 12    | Founder 1          | Secret header, constant-time check, direct URL rejection tests, rotation              | Requests without origin secret reaching app                |
| T-03 | Payment webhook failure or duplicate charge             | 3   | 5   | 15    | Founder 1          | Signature verification, event dedupe, idempotency, reconciliation, alerting           | Webhook lag > 5 minutes; duplicate event IDs               |
| T-04 | Offline attendance data loss or duplicate records       | 3   | 4   | 12    | Mobile + Founder 2 | SQLCipher, outbox, operation IDs, conflict UI, device matrix, purge policy            | Sync failure rate > 1%; conflict spike                     |
| T-05 | Single-zone Cloud SQL failure causes prolonged outage   | 3   | 4   | 12    | Founder 1          | PITR, backups, restore drills, runbook, HA at 10 schools                              | Failed restore drill; storage/CPU saturation               |
| T-06 | Report-card calculation or rendering defect             | 3   | 4   | 12    | Product + QA       | Golden tests, school preview, publish gate, versioning, audit                         | Template mismatch in UAT; missing marks at publish         |
| T-07 | Payroll calculation defect                              | 3   | 5   | 15    | Founder 1 + CA     | Golden fixtures, CA sign-off, approval/lock, reversal workflow, reproducible runs     | Exception count high; CA rejects export                    |
| T-08 | Performance degradation at peak                         | 3   | 3   | 9     | Founder 1          | Load tests, indexes, pooling, queue scaling, warm instance                            | p95 > 800ms; DB CPU > 80%                                  |
| T-09 | Supply-chain vulnerability in dependency                | 3   | 4   | 12    | Founder 1          | Lockfiles, audit, minimal deps, Trivy, Renovate, review                               | Critical advisory in a direct dependency                   |
| T-10 | Secret leakage in repo or logs                          | 3   | 5   | 15    | Founder 1          | Secret scanning, Secret Manager, log redaction, rotation plan                         | Secret scanner alert; secret in error report               |
| T-11 | Staging and production isolation failure                | 2   | 5   | 10    | Founder 1          | Separate SAs, DBs, buckets, queues; IAM tests; no prod secrets in staging             | Staging job writes to prod resource                        |
| T-12 | Mobile app store rejection                              | 3   | 3   | 9     | Mobile             | Early submission, privacy forms, account deletion, reviewer access, policy review     | First internal review flags issues                         |
| T-13 | Backup restore fails when needed                        | 2   | 5   | 10    | Founder 1          | Quarterly drills, verify row counts, document RTO, test app against restored DB       | Drill duration exceeds target                              |
| T-14 | Data export or document leak via signed URL             | 2   | 5   | 10    | Founder 1          | Short expiry, auth check before signing, private buckets, audit downloads             | URL shared beyond recipient; unusual download volume       |
| T-15 | CSV/formula injection in exports                        | 3   | 3   | 9     | Engineering        | Escape leading `=`, `+`, `-`, `@`; test exports                                       | Security review finding                                    |

## 6. Vendors and Compliance

| ID   | Risk                                              | L   | I   | Score | Owner     | Mitigation                                                                                       | Early warning                                     |
| ---- | ------------------------------------------------- | --- | --- | ----- | --------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| V-01 | DLT registration or SMS template approval delayed | 4   | 3   | 12    | Founder 2 | Start in December; use MSG91 guidance; keep push/email fallback                                  | No DLT entity by February                         |
| V-02 | WhatsApp BSP onboarding or template rejection     | 4   | 3   | 12    | Founder 2 | Select BSP early; submit utility templates; avoid marketing-heavy use                            | Template rejected twice                           |
| V-03 | Razorpay KYC or live activation delayed           | 3   | 4   | 12    | Founders  | Start KYC in December; complete documentation; test mode until live                              | KYC pending beyond 3 weeks                        |
| V-04 | Play Store production approval delayed            | 3   | 3   | 9     | Mobile    | Submit closed testing early; complete data safety and privacy forms                              | Review stuck beyond 7 days                        |
| V-05 | DPDP compliance gap                               | 3   | 5   | 15    | Founders  | Counsel review; DPA; consent records; retention/deletion; breach process                         | Missing DPA with a pilot; no deletion flow        |
| V-06 | Pen test finds critical issues late               | 3   | 4   | 12    | Founder 1 | Book vendor by May; test staging in August; reserve remediation time                             | No vendor shortlist by March                      |
| V-07 | Messaging costs exceed allowance                  | 4   | 3   | 12    | Product   | Push-first, caps, opt-outs, template discipline, pass-through pricing                            | Cost per school > ₹3,000/month                    |
| V-08 | Vendor outage or price change                     | 3   | 3   | 9     | Founder 1 | Adapters, fallback channels, annual contract review, exit plan                                   | Repeated provider incidents                       |
| V-09 | Cloudflare free plan limits                       | 3   | 2   | 6     | Founder 1 | Monitor limits; Workers Paid is cheap; upgrade trigger documented                                | 429s or Worker limit warnings                     |
| V-10 | Legal entity, contracts, or IP issues             | 2   | 4   | 8     | Founders  | Incorporate early; standard contracts; IP assignment; trademark search                           | Contract redlines stall a pilot                   |
| V-11 | Data residency requirement beyond India           | 2   | 4   | 8     | Founders  | Keep primary data in Mumbai; confirm pilot requirements; no cross-border transfer without review | School asks for local hosting or foreign transfer |

## 7. Business and Financial

| ID   | Risk                                        | L   | I   | Score | Owner         | Mitigation                                                                  | Early warning                                  |
| ---- | ------------------------------------------- | --- | --- | ----- | ------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| B-01 | Fewer than 5 paying schools by October 2027 | 3   | 5   | 15    | Founders      | Start sales in April; pilot references; transparent pricing; target 10 LOIs | Fewer than 5 qualified pilots by June          |
| B-02 | Pricing too low for unit economics          | 3   | 4   | 12    | Founders      | Validate willingness to pay; include messaging allowance; annual contracts  | Discounts requested above 25%                  |
| B-03 | Long sales cycle                            | 4   | 3   | 12    | Founders      | Start early; owner/principal champion; pilot proof; simple contract         | First meeting to LOI > 8 weeks                 |
| B-04 | Pilot school drops out                      | 2   | 4   | 8     | Founders      | Signed LOI, named owners, success criteria, weekly check-ins, backup pilot  | Champion leaves or payment delays              |
| B-05 | HA and messaging push costs above ₹30k      | 4   | 3   | 12    | Founders      | Budget triggers, pass-through pricing, staging consolidation, HA timing     | Monthly bill > ₹25k for two months             |
| B-06 | Support load exceeds team capacity          | 3   | 4   | 12    | Founders      | Self-service help, school super users, ticket triage, hire at 10 schools    | Tickets per school rising, response SLA missed |
| B-07 | Competitor undercuts or bundles             | 3   | 3   | 9     | Founders      | Focus on service, offline attendance, parent UX, transparent pricing        | Lost deals cite price only                     |
| B-08 | Renewals fail in 2028                       | 3   | 5   | 15    | Founders      | Adoption metrics, quarterly reviews, measurable ROI, reference program      | Attendance or parent usage declines            |
| B-09 | Messaging/payment pass-through disputes     | 3   | 3   | 9     | Founders      | Clear contract terms, usage reports, caps, reconciliation                   | School disputes invoice                        |
| B-10 | GST/tax treatment incorrect                 | 2   | 4   | 8     | Founders + CA | CA review of pricing, invoices, and fee-head GST                            | Notice or customer complaint                   |

## 8. Operations

| ID   | Risk                                                            | L   | I   | Score | Owner          | Mitigation                                                           | Early warning                         |
| ---- | --------------------------------------------------------------- | --- | --- | ----- | -------------- | -------------------------------------------------------------------- | ------------------------------------- |
| O-01 | Insufficient monitoring misses a failure                        | 3   | 4   | 12    | Founder 1      | SLOs, alerts, dashboards, uptime checks, synthetic tests             | Incident found by a school first      |
| O-02 | Incident response is slow or chaotic                            | 3   | 4   | 12    | Founders       | Runbooks, on-call rotation, tabletop, status page                    | First incident lacks a clear owner    |
| O-03 | Data deletion or correction request mishandled                  | 2   | 5   | 10    | Founders       | Written workflow, identity verification, retention exceptions, audit | Request sits unresolved > 7 days      |
| O-04 | School suspension or non-payment handled poorly                 | 3   | 3   | 9     | Founders       | Grace period, notice, export, reactivation process                   | Suspension without warning            |
| O-05 | Migration leaves stale data in staging                          | 3   | 3   | 9     | Implementation | Delete staging copies after go-live; access review; DPA              | Old student data found in staging     |
| O-06 | Status page or school communication unavailable during incident | 3   | 3   | 9     | Founders       | Independent status page, contact list, templates                     | No way to reach schools during outage |

## 9. Risk Review Process

- **Weekly:** review critical/high risks, update scores, confirm owners and dates.
- **Monthly:** review all risks; add new ones from incidents, audits, and pilot feedback.
- **At gates:** explicit risk review before go/no-go; no critical risk may be unowned.
- **After incidents:** add or update risks and mitigations.
- **Quarterly:** archive closed risks; review accepted risks.

**Risk acceptance:** a critical or high risk may be accepted only by a founder, with a written rationale, expiry date, and compensating control.

## 10. Related Documents

- [11-security-and-compliance.md](11-security-and-compliance.md)
- [14-observability-and-operations.md](14-observability-and-operations.md)
- [16-delivery-roadmap.md](16-delivery-roadmap.md)
- [17-team-and-hiring-plan.md](17-team-and-hiring-plan.md)
- [18-pilot-onboarding-and-migration.md](18-pilot-onboarding-and-migration.md)
