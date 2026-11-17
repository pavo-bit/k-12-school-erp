# Product Vision and Scope

**Status:** Baseline  
**Owner:** Product  
**Related:** [00-executive-summary.md](00-executive-summary.md), [02-personas-and-user-journeys.md](02-personas-and-user-journeys.md), [03-functional-requirements.md](03-functional-requirements.md), [16-delivery-roadmap.md](16-delivery-roadmap.md)

---

## 1. Vision

**Every Indian school should run on one reliable system that teachers trust, parents can use, and administrators can afford.**

School ERP is a multi-tenant SaaS platform that replaces spreadsheets, disconnected fee software, paper registers, and WhatsApp chaos with a single operational system for students, fees, attendance, exams, staff, and communication.

## 2. Mission

Build a professional-grade K-12 school ERP that is:

- **India-first:** UPI/Razorpay, DLT-compliant SMS, WhatsApp, CBSE/ICSE-friendly academics, DPDP-aware consent, INR and Indian date/number formats.
- **Teacher-friendly:** fast attendance, offline capture, minimal clicks, mobile-first.
- **Parent-friendly:** fees, attendance, results, receipts, and announcements in one app.
- **Administrator-friendly:** accurate money, audit trails, simple onboarding, reliable reports.
- **Affordable:** low operational cost, transparent pricing, no per-school code forks.
- **Trustworthy:** tenant isolation, backups, auditability, and measured availability.

## 3. Target Market

### Primary segment

Private K-12 day schools in India:

- 500–5,000 students
- CBSE, ICSE, or State board
- One to three branches
- Currently using spreadsheets, legacy desktop software, or a dated ERP
- Fee collection via cash, cheque, UPI, and cards
- Parents on Android phones with variable connectivity

### Secondary segment

Multi-branch trusts and school groups that need organization-level reporting and shared administration.

### Not the initial target

- Colleges and higher-education institutions
- Coaching institutes
- Fully residential boarding schools at launch
- International schools requiring IB/IGCSE-specific workflows
- Government schools with centralized procurement

These may be evaluated after GA.

## 4. Buyer and Users

| Role                       | Relationship                              |
| -------------------------- | ----------------------------------------- |
| School owner / trust board | Economic buyer                            |
| Principal                  | Champion and operational approver         |
| School administrator       | Day-to-day owner                          |
| Accountant                 | Fee and payroll operator                  |
| Teacher                    | Daily user; adoption decides success      |
| Parent / guardian          | Daily user of the parent app              |
| Student                    | Future portal user; not a launch priority |
| Platform team              | Operates the SaaS and supports schools    |

## 5. Product Principles

1. **Money must be correct.** Every payment, receipt, refund, and concession is auditable. No silent edits.
2. **Attendance must be fast.** A teacher should mark a class in under 60 seconds, online or offline.
3. **Parents should not need training.** The parent app must be obvious without a manual.
4. **Configuration over forks.** School-specific needs are handled by settings, templates, custom fields, and entitlements—not separate code branches.
5. **Server-side authorization always.** UI hiding is never the security boundary.
6. **Academic year is a first-class dimension.** Enrollment, fees, exams, and timetable are year-scoped.
7. **Offline where it matters.** Attendance works offline; financial and exam data require a connection and server validation.
8. **India-first defaults, global-ready structure.** Currency, locale, timezone, and compliance are configurable.
9. **Low operational burden.** Managed services, serverless compute, and few moving parts.
10. **Measure everything that matters.** SLOs, error budgets, payment reconciliation, queue health, and adoption.

## 6. Release Scope

### Beta — June 2027

Target: 1–2 pilot schools, start of the 2027–28 academic year.

- School onboarding, branding, academic year setup
- Student, guardian, and staff records
- Classes, sections, subjects, enrollment
- Bulk imports with validation and dry run
- Daily attendance, web and offline teacher app
- Basic timetable grid
- Fee heads, structures, invoices, concessions, dues
- Razorpay/UPI payments, offline receipts, reconciliation
- Salary structures, payroll run, payslips, statutory export
- Email, SMS, WhatsApp, and push notifications
- Parent app: attendance, fees/pay, receipts, announcements
- Teacher app: today’s classes, offline attendance, payslips/leave, announcements
- Web admin, basic dashboards, audit log
- Role-based access, tenant isolation, backups

### General availability — October 2027

Target: 5–10 paying schools.

- Exams, marks entry, grading, report cards, publish workflow
- Parent app results and report-card download
- Teacher app marks entry
- Lean admissions: enquiry → application → document upload → convert to student
- Advanced fee reports, refunds, reconciliation exceptions
- Scheduled reports and exports
- Platform admin: school management, entitlements, impersonation, usage
- Play Store production release
- Load testing, penetration testing, restore drill, DPDP documents
- Training materials and support runbooks

### Post-GA

- iOS parent and teacher apps
- Transport management, GPS integration
- Library management
- Hostel management
- Inventory and asset management
- Cafeteria wallet
- Website CMS and public school pages
- LMS, homework, question bank, online exams
- Tally export and accounting integrations
- Full statutory payroll filing
- Promotion, rollover, and alumni
- Certificates and transfer certificates
- BI dashboards and data warehouse
- Custom workflows and advanced custom fields
- White-label apps and custom domains
- Student portal
- Biometric/RFID device integrations

### Explicitly out of scope for year one

- Full general ledger accounting
- Statutory payroll filing
- Native iOS at launch
- Per-school custom code
- AI-generated report-card remarks or predictive analytics
- Multi-country tax and payroll rules

## 7. Non-Functional Requirements

| Category        | Requirement                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Availability    | 99.5% monthly for beta; 99.9% target after HA at 10 schools                                               |
| Performance     | p95 under 800ms for core web pages; attendance sync under 3s for a 60-student class on 3G                 |
| Scale           | 20 schools / 20,000 students / 2,000 concurrent users without re-architecture                             |
| Security        | Tenant isolation, RBAC, audit, encryption, MFA for admins, OWASP ASVS L2 intent                           |
| Privacy         | DPDP Act 2023 and applicable rules; consent, children’s data safeguards, deletion rights                  |
| Accessibility   | WCAG 2.1 AA for web; accessible labels and font scaling on mobile                                         |
| Localization    | English, Hindi, and one regional language at launch; INR and Asia/Kolkata                                 |
| Compatibility   | Current Chrome, Edge, Safari, Firefox; Android 9+; responsive down to 360px                               |
| Reliability     | RPO 15 minutes, RTO 4 hours pre-HA; improve with HA                                                       |
| Observability   | Structured logs, metrics, alerts, error tracking, audit trail                                             |
| Maintainability | Modular monolith, typed contracts, migrations, ADRs, documented runbooks                                  |
| Portability     | Docker images and Terraform; GCP-first but not locked to proprietary runtime APIs beyond managed services |

## 8. Commercial Model Assumptions

These are planning assumptions, not final pricing:

- Annual subscription priced per active student, with a minimum annual fee.
- One-time onboarding and migration fee.
- SMS/WhatsApp usage either included as an allowance or passed through at cost.
- Razorpay transaction fees borne by the school or passed through.
- Premium modules (transport, library, hostel, LMS) sold as add-ons.
- Manual invoices at launch; automated subscription billing post-GA.
- Pilot schools receive a discounted or waived fee in exchange for feedback and a reference commitment.

## 9. Success Metrics

### Product

- Attendance completion rate above 80% of class-sessions.
- Median attendance marking time under 60 seconds.
- Parent app monthly active use above 60% of families.
- Online fee payment success above 95% of attempts.
- Report cards generated in bulk in under 10 minutes for 1,000 students.
- Notification delivery success above 95%.
- Support tickets per school per month trending down.

### Business

- 5–10 paying schools by October 2027.
- Pilot renewal for 2028–29.
- Revenue covers cloud and vendor run-rate by GA.
- Onboarding time of six to eight weeks including hypercare, once clean data is received.
- Net promoter score above 30 from principals and accountants.

### Engineering

- Zero cross-tenant data incidents.
- 99.5% uptime for beta; 99.9% after HA.
- p95 under 800ms for core pages.
- Restore drill passed before beta and GA.
- Critical/high security findings closed before GA.
- Error rate below 0.5% for core APIs.

## 10. Assumptions and Constraints

- The team is in-house: three founders plus one mobile engineer and one QA engineer; the capacity plan assumes all three founders are full-time.
- If only two founders are full-time, reduce scope or move the beta and GA dates; the plan has no spare capacity.
- No development contractors.
- AWS Mumbai (`ap-south-1`) is the primary region.
- CloudFront is the edge provider at launch.
- Aurora Serverless v2 auto-scales; no HA trigger needed (multi-AZ by default).
- Staging shares the AWS account with separate databases, Lambda functions, queues, secrets, and IAM roles.
- Beta and GA dates depend on the mobile hire starting in January 2027 and the QA hire starting in February 2027.
- Pilot schools must provide data samples and named operational contacts.
- Legal and penetration-test budgets are separate from the monthly cloud budget.
- Regional language choice depends on the pilot schools.

## 11. Scope Governance

- Beta and GA scope are frozen at the go/no-go gates.
- New requests go to a post-GA backlog unless they are required for legal, security, or pilot retention.
- Any scope change requires an update to this document, the roadmap, and the risk register.
- Architecture changes require an ADR.
- Pricing changes require a commercial review.

## 12. Related Documents

- [02-personas-and-user-journeys.md](02-personas-and-user-journeys.md)
- [03-functional-requirements.md](03-functional-requirements.md)
- [modules/README.md](modules/README.md)
- [16-delivery-roadmap.md](16-delivery-roadmap.md)
- [23-open-decisions.md](23-open-decisions.md)
