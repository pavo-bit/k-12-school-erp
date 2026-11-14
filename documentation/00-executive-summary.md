# Executive Summary

**Project:** School ERP — multi-tenant SaaS for Indian K-12 day schools  
**Delivery:** 10–12 months; pilot beta June 2027; GA October 2027  
**Team:** 3 founders (all full-time) + one in-house mobile engineer + one in-house QA engineer  
**Cloud:** GCP Mumbai, Cloud Run, Cloud SQL PostgreSQL, Cloudflare, Expo mobile apps  
**Run-rate target:** ₹15–30k/month for GCP and vendors, excluding SMS/WhatsApp usage and payment fees

---

## 1. The Problem

Indian K-12 schools run on a patchwork of spreadsheets, WhatsApp groups, desktop fee software, and disconnected exam tools. The consequences are predictable:

- Fee demand and collection are hard to reconcile; receipts and dues are error-prone.
- Attendance is manual and rarely reaches parents in time.
- Report cards take weeks of teacher effort and are difficult to standardize.
- Payroll and statutory exports are handled outside the school system.
- Parents have no single place for fees, attendance, results, and communication.
- School leaders lack timely, reliable operational data.

Existing ERP products are often expensive, dated, over-customized, or weak on parent experience and offline use. Smaller schools are underserved.

---

## 2. The Product

A professional, multi-tenant school ERP with:

- **Students and admissions:** student records, guardians, enrollment, documents, enquiries, applications, conversion.
- **Attendance and timetable:** daily attendance, offline teacher capture, basic timetable, absence alerts.
- **Fees and payments:** fee structures, invoices, concessions, UPI/card payments, offline receipts, dues, reconciliation, gapless receipts.
- **Exams and report cards:** marks entry, configurable grading, report-card templates, publish workflow, parent access.
- **HR and payroll:** staff records, leave, salary structures, payroll runs, payslips, statutory exports.
- **Communication:** announcements, absence alerts, fee reminders, results, WhatsApp/SMS/email/push.
- **Reports:** enrollment, attendance, fee collection, outstanding, exam results, payroll summaries.
- **Parent app:** children, attendance, fees/pay, receipts, results, announcements.
- **Teacher app:** today’s classes, offline attendance, marks entry, payslips/leave, announcements.
- **Platform administration:** school onboarding, branding, roles, entitlements, support, audit.

**Differentiators**

1. India-first payments, messaging, compliance, and academic templates.
2. Reliable offline attendance for patchy school connectivity.
3. Parent experience that feels like a consumer app, not a portal from 2010.
4. Transparent, predictable pricing for schools.
5. Configurable workflows without per-school code forks.

---

## 3. Target Market and Commercial Model

**Initial segment:** private K-12 day schools (CBSE/ICSE/State board), 500–5,000 students, one to three branches.

**Launch plan**

- 1–2 beta schools from June 2027.
- 5–10 paying schools by October 2027.
- Multi-branch trusts are supported through the organization → school hierarchy.

**Commercial assumptions to validate**

- Annual per-student SaaS subscription, billed annually or per term.
- One-time onboarding and data-migration fee.
- SMS/WhatsApp usage pass-through or included allowance.
- Optional premium modules later (transport, library, hostel, LMS).
- Manual invoicing at launch; automated subscription billing post-GA.

---

## 4. Delivery Strategy

The academic calendar drives the release plan:

| Milestone            | Date         | Schools | Scope                                                                             |
| -------------------- | ------------ | ------- | --------------------------------------------------------------------------------- |
| Internal alpha       | April 2027   | 0       | SIS, fees, attendance, web admin                                                  |
| Pilot beta           | June 2027    | 1–2     | SIS, fees, attendance, payroll, timetable, notifications, parent and teacher apps |
| General availability | October 2027 | 5–10    | Adds exams/report cards, admissions, full reporting, Play Store production        |
| Stabilization        | Nov–Dec 2027 | 5–10    | iOS, HA at 10 schools, performance, 2028 roadmap                                  |

**Go/no-go gates**

- **31 March 2027:** foundation, SIS, fees, attendance working; mobile beta builds; tenant-isolation tests green.
- **31 May 2027:** offline attendance, payroll, notifications, migration dry run; beta readiness.
- **30 September 2027:** exams, admissions, load/security testing, GA readiness.

If a gate slips, move the date. Do not compress QA or security.

---

## 5. Architecture at a Glance

```
Cloudflare DNS / SSL / WAF
  ├── *.erp.com ──────► Worker ──► Cloud Run web (Next.js)
  ├── api.erp.com ────► Worker ──► Cloud Run API
  └── staging hosts ──► Worker ──► Cloud Run staging

Cloud Scheduler ──► outbox dispatcher ──► Cloud Tasks
Cloud Tasks ──────► Cloud Run worker / pdf-worker
Cloud Run ──────► Cloud SQL PostgreSQL (RLS)
              ├─► Cloud Storage
              ├─► Secret Manager + Cloud KMS
              └─► FCM / Resend / MSG91 / WhatsApp / Razorpay
```

**Key choices**

- Modular monolith, not microservices.
- Shared database with `school_id` and Postgres RLS.
- Cloudflare Worker handles wildcard subdomains and injects a secret origin header.
- Cloud Run keeps one warm web instance; workers scale to zero.
- Cloud Tasks and a transactional outbox provide reliable background jobs.
- Better Auth handles web sessions and phone OTP; mobile uses access/refresh tokens.
- Expo/React Native one-codebase apps for parent and teacher.
- Offline attendance only; marks remain online.
- Chromium in a dedicated `pdf-worker` generates report cards, receipts, and payslips.
- Single-zone Cloud SQL until 10 schools, then HA.

---

## 6. Team and Budget

| Role                                                        | Count  |
| ----------------------------------------------------------- | ------ |
| Founders (tech lead, product/full-stack, full-stack/design) | 3      |
| In-house mobile engineer                                    | 1 hire |
| In-house QA automation engineer                             | 1 hire |

**Capacity:** about 52 person-months gross over 11 months, roughly 43 after onboarding, leave, and support. The planned allocation is about 53 person-months, so the roadmap depends on founder overtime and the scope trade list. Hiring delays force date changes.

**Monthly run-rate at launch**

| Item                                             | Estimate           |
| ------------------------------------------------ | ------------------ |
| Cloud Run web (1 warm)                           | ₹2,000–3,500       |
| Cloud Run worker                                 | ₹500–1,500         |
| Cloud Run pdf-worker                             | ₹500–2,000         |
| Cloud SQL single-zone, 1 vCPU/3.75GB, 50GB, PITR | ₹6,000–9,000       |
| Storage, tasks, secrets, KMS, registry           | ₹600–1,750         |
| Logging, monitoring, egress                      | ₹1,100–3,300       |
| Cloudflare, Sentry, domain, GitHub, email        | ₹70–6,725          |
| **Total**                                        | **₹10,800–27,800** |
| Cloud SQL HA at 10 schools                       | **+₹8,000–15,000** |

**Budget trigger:** review at 8 schools. HA at 10 schools may push the total above ₹30k; raise the budget, drop the shared staging database, or delay HA until revenue supports it. See [15-cost-model.md](15-cost-model.md) for assumptions and exclusions.

**Excluded variable costs:** SMS, WhatsApp, email overages, Razorpay transaction fees. Pass these through to schools or include them in the subscription.

**One-time costs:** hiring, penetration test, legal/DPDP documents, Google Play ($25), Apple Developer ($99/year later), domain, and onboarding/data-migration effort.

---

## 7. Key Risks

| Risk                            | Mitigation                                                                  |
| ------------------------------- | --------------------------------------------------------------------------- |
| Hiring delays for mobile/QA     | Start immediately; if not hired by February, move beta/GA dates             |
| Scope creep                     | Beta/GA scope freeze; change control; post-GA backlog                       |
| Cloudflare Worker origin bypass | Secret header, constant-time check, rotation, direct-origin rejection tests |
| Cloudflare free limits          | Monitor; upgrade to Workers Paid/Pro if needed                              |
| Shared staging database         | Separate DB user/services/queues; connection limits; move at 10 schools     |
| Single-zone database failure    | PITR, backups, restore drills; HA at 10 schools                             |
| Offline sync conflicts          | Attendance only, idempotency, conflict UI, dedicated test matrix            |
| Payroll compliance              | CA validation; export files, not filing                                     |
| Report-card correctness         | Golden tests, school sign-off, versioned templates                          |
| App store rejection             | Submit early; privacy/data safety/account deletion                          |
| SMS/WhatsApp approval delay     | Start DLT and template registration in December                             |
| DPDP/legal gaps                 | Counsel-reviewed documents; consent/deletion flows; vendor DPAs             |
| Informal pilots                 | Signed LOIs and paid pilots                                                 |

---

## 8. Success Metrics

**Product**

- Attendance marked in under 60 seconds per class.
- Parent fee payment completed in under 2 minutes.
- Report cards generated in bulk without blocking the app.
- Parent app monthly active use above 60% of enrolled families.
- Teacher app used for at least 80% of attendance records.
- Notification delivery success above 95%.

**Business**

- 5–10 paying schools by October 2027.
- Pilot schools renew for the 2028–29 academic year.
- Gross revenue covers GCP and vendor run-rate by GA.
- Onboarding a school in six to eight weeks, including hypercare, once clean data is received.
- Support tickets per school trending down month over month.

**Engineering**

- 99.5% uptime for beta; 99.9% after HA.
- p95 under 800ms for core pages.
- Zero cross-tenant data incidents.
- Restore drill passed before beta and GA.
- Critical/high security findings closed before GA.

---

## 9. Immediate Next Steps

1. Start hiring the mobile engineer and QA automation engineer; target January 2027 for mobile and February 2027 for QA.
2. Set up the GCP organization, production project, billing alerts, Terraform, GitHub OIDC, Artifact Registry, Cloud Run, and Cloud SQL.
3. Confirm the domain and set up Cloudflare DNS, Worker skeleton, Resend domain, MSG91 DLT, WhatsApp BSP, Razorpay KYC, and Google Play account.
4. Sign pilot LOIs and collect fee, report-card, timetable, student, and staff samples.
5. Write the first ADRs and begin the Phase 0 vertical slice.

See [23-open-decisions.md](23-open-decisions.md) for the inputs needed to lock dates.
