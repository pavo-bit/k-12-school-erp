# Open Decisions

**Status:** Living document  
**Owner:** Founders  
**Review:** Weekly  
**Related:** [README.md](README.md), [16-delivery-roadmap.md](16-delivery-roadmap.md), [19-risk-register.md](19-risk-register.md)

---

## 1. Purpose

This is the decision log for inputs that are not yet locked. Each decision has an owner, a deadline, and a default recommendation. A decision is not closed until it is recorded here, communicated, and reflected in the affected documents.

**Status values:** `Open`, `In progress`, `Decided`, `Deferred`, `Superseded`.

## 2. Decision Process

1. State the decision and why it matters.
2. List realistic options with trade-offs.
3. Record the recommendation and owner.
4. Decide by the deadline or explicitly defer.
5. Update affected documents and code.
6. Record the date and rationale.

For architecture decisions, add an ADR. For scope changes, update `01-product-vision-and-scope.md` and `16-delivery-roadmap.md`.

## 3. Business and Commercial

| ID    | Decision                           | Options                                                           | Recommendation                                                        | Owner    | Deadline | Status |
| ----- | ---------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- | -------- | -------- | ------ |
| OD-01 | Domain name and ownership          | Candidate domains; registrar; Cloudflare account owner            | Choose a short `.com` or `.in`; company-owned account with two admins | Founders | Dec 2026 | Open   |
| OD-02 | Subscription pricing               | Per student/year; per school/year; module bundles; hybrid         | Per-student annual with minimum fee; validate with 5 pilots           | Founders | Mar 2027 | Open   |
| OD-03 | Pilot commercial terms             | Free; discounted; paid with success credit                        | Paid but heavily discounted; signed LOI; reference commitment         | Founders | Jan 2027 | Open   |
| OD-04 | Messaging allowance                | Included allowance; pass-through at cost; separate prepaid wallet | Included allowance per student with overage pass-through              | Founders | Apr 2027 | Open   |
| OD-05 | Billing automation                 | Manual invoices at launch; Razorpay subscriptions; hybrid         | Manual invoices through 2027; automate post-GA                        | Founders | May 2027 | Open   |
| OD-06 | Legal entity and trademark         | Private Limited now vs later; trademark filing                    | Incorporate before first paid pilot; file trademark                   | Founders | Jan 2027 | Open   |
| OD-07 | One-time legal and pen-test budget | ₹1–2 lakh; ₹2–4 lakh; defer                                       | Budget ₹3–5 lakh combined; book pen test by May 2027                  | Founders | Jan 2027 | Open   |
| OD-08 | GCP and vendor account ownership   | Founder personal; company; agency                                 | Company-owned, two admins, MFA, billing alerts                        | Founders | Dec 2026 | Open   |

## 4. Product and Scope

| ID    | Decision                              | Options                                                 | Recommendation                                                 | Owner   | Deadline | Status   |
| ----- | ------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- | ------- | -------- | -------- |
| OD-09 | Regional language at launch           | Marathi; Tamil; Telugu; Kannada; Gujarati; Bengali      | Decide from pilot schools by March; Marathi if Mumbai-first    | Product | Mar 2027 | Open     |
| OD-10 | Parent web portal at beta             | App only; responsive web; full portal                   | Minimal responsive web for fees/attendance; app is primary     | Product | Feb 2027 | Open     |
| OD-11 | Student portal timing                 | Beta; GA; post-GA                                       | Post-GA                                                        | Product | Feb 2027 | Deferred |
| OD-12 | Custom fields scope                   | None; student/staff only; all entities                  | Student and staff custom fields at GA; no custom logic         | Product | Mar 2027 | Open     |
| OD-13 | Sibling linking                       | Beta; GA; post-GA                                       | GA, if pilot data shows demand                                 | Product | Mar 2027 | Open     |
| OD-14 | Admission number editability          | Never; admin with audit; any time                       | Admin only before financial activity, then locked              | Product | Feb 2027 | Open     |
| OD-15 | Report-card templates                 | One standard; 2–3 configurable; per-school HTML         | 2–3 configurable templates with school branding                | Product | Apr 2027 | Open     |
| OD-16 | Co-scholastic and practical marks     | Include at GA; post-GA; subject-only                    | Practical marks at GA if pilot requires; co-scholastic post-GA | Product | Apr 2027 | Open     |
| OD-17 | Rank/percentile policy                | Off; school-configurable; always on                     | Off by default; configurable post-GA                           | Product | May 2027 | Open     |
| OD-18 | Late fees at beta                     | Yes; no; GA                                             | No at beta; configurable at GA                                 | Product | Mar 2027 | Open     |
| OD-19 | Combined sibling payment              | Beta; GA; post-GA                                       | Separate transactions at beta; combined post-GA                | Product | Apr 2027 | Open     |
| OD-20 | Teacher authentication                | Phone OTP; email/password; both                         | Phone OTP default; email/password if school requires           | Product | Mar 2027 | Open     |
| OD-21 | Teacher app PIN                       | Required; optional; none                                | Optional at beta; school policy at GA                          | Product | Apr 2027 | Open     |
| OD-22 | Guardian phone visibility to teachers | Full; masked; none                                      | Masked, with call action only if school enables                | Product | Apr 2027 | Open     |
| OD-23 | Offline attendance for yesterday      | Today only; today and yesterday                         | Today and yesterday, with cutoff warning                       | Product | Apr 2027 | Open     |
| OD-24 | Receipt sharing                       | Authenticated download only; expiring public link; both | Authenticated download; expiring link for WhatsApp             | Product | May 2027 | Open     |

## 5. Academic and Payroll Details

| ID    | Decision                               | Options                                           | Recommendation                                                       | Owner              | Deadline | Status   |
| ----- | -------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- | ------------------ | -------- | -------- |
| OD-25 | Beta and GA date confirmation          | Hold June/October; shift                          | Hold, contingent on January hiring                                   | Founders           | Feb 2027 | Open     |
| OD-26 | Report-card content by board           | CBSE-style; ICSE-style; state-style; configurable | Configurable template with board presets                             | Product            | Apr 2027 | Open     |
| OD-27 | Absent student report card             | Issue with zero; issue with “absent”; withhold    | Issue with “absent” and result status per school policy              | Product            | May 2027 | Open     |
| OD-28 | Payroll components and statutory rules | Standard set; school-specific; configurable       | Configurable components; CA validates per school                     | Product + CA       | Apr 2027 | Open     |
| OD-29 | Segregation of duties                  | Enforced; optional; off                           | Optional at beta, enforced at GA for payroll/refunds                 | Product            | Apr 2027 | Open     |
| OD-30 | Loans/advances                         | Beta; GA; post-GA                                 | Post-GA                                                              | Product            | Mar 2027 | Deferred |
| OD-31 | GST treatment per fee head             | Exempt; taxable; mixed                            | CA determines per school; configuration supports both                | Founders + CA      | Apr 2027 | Open     |
| OD-32 | Fee allocation order                   | Oldest first; fee-head priority; manual           | Oldest due first, then fee-head priority; manual override with audit | Product            | Mar 2027 | Open     |
| OD-33 | Refund policy                          | School decides; platform default                  | School-configurable; platform enforces limits and audit              | Product            | Apr 2027 | Open     |
| OD-34 | Retention periods                      | 3/5/7/8 years by data type                        | Use the schedule in `08-data-model.md`; confirm with counsel         | Founders + counsel | Feb 2027 | Open     |

## 6. Technical and Operations

| ID    | Decision                     | Options                                             | Recommendation                                                                         | Owner       | Deadline | Status  |
| ----- | ---------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------- | -------- | ------- |
| OD-35 | Cloudflare paid tier trigger | Free only; Workers Paid; Pro                        | Start free; upgrade if Worker limits or WAF needs require                              | Engineering | Jan 2027 | Open    |
| OD-36 | Cloud SQL HA trigger         | 10 schools; revenue threshold; contract requirement | 10 schools or first contractual 99.9% requirement                                      | Founders    | Sep 2027 | Open    |
| OD-37 | Staging database separation  | Shared instance; separate instance                  | Shared until 10 schools; then separate                                                 | Engineering | Aug 2027 | Open    |
| OD-38 | Log retention                | 30 days; 90 days; 1 year                            | 30 days app logs; 1 year security logs; legal review                                   | Founders    | Feb 2027 | Open    |
| OD-39 | Backup retention             | 30 days; 90 days; 1 year                            | 30 days + 7-day PITR; revisit after GA                                                 | Engineering | Jan 2027 | Open    |
| OD-40 | Mobile OTA updates           | None; Expo Updates for JS; full store only          | Store releases at launch; evaluate OTA post-GA                                         | Mobile      | Jun 2027 | Open    |
| OD-41 | iOS timing                   | Nov 2027; Q1 2028; later                            | Start in November 2027; TestFlight in December 2027; App Store release by January 2028 | Founders    | Sep 2027 | Open    |
| OD-42 | WhatsApp BSP                 | Gupshup; Interakt; Kaleyra; Meta direct             | Choose based on template approval speed and per-message cost                           | Product     | Feb 2027 | Open    |
| OD-43 | Impersonation approval       | Single admin; second admin; time-bound only         | Time-bound plus second admin when available                                            | Founders    | Mar 2027 | Open    |
| OD-44 | Plan entitlements scope      | Per school; per organization                        | Per school at launch; organization billing post-GA                                     | Founders    | May 2027 | Open    |
| OD-45 | Organization-level billing   | GA; post-GA                                         | Post-GA; manual invoices for trusts at launch                                          | Founders    | May 2027 | Open    |
| OD-46 | Support SLA commitments      | Best effort; 4-hour P1; 1-hour P1                   | 4-hour response for P1 during support hours; 24/7 best effort at beta                  | Founders    | May 2027 | Open    |
| OD-47 | AI features                  | None; remarks assistance; analytics                 | None at launch; no child data to third-party AI                                        | Founders    | Jan 2027 | Decided |
| OD-48 | Data residency               | India only; India + global                          | India only at launch                                                                   | Founders    | Jan 2027 | Decided |
| OD-49 | Public API for third parties | None; read-only; full                               | None in year one                                                                       | Founders    | Feb 2027 | Decided |
| OD-50 | White-label apps             | No; yes                                             | No in year one                                                                         | Founders    | Feb 2027 | Decided |

## 7. Hiring

| ID    | Decision                    | Options                             | Recommendation                               | Owner    | Deadline | Status |
| ----- | --------------------------- | ----------------------------------- | -------------------------------------------- | -------- | -------- | ------ |
| OD-51 | Mobile engineer start date  | Jan 2027; Feb 2027; contract        | Jan 2027 full-time                           | Founders | Dec 2026 | Open   |
| OD-52 | QA engineer start date      | Jan 2027; Feb 2027; Mar 2027        | Feb 2027 full-time                           | Founders | Jan 2027 | Open   |
| OD-53 | Compensation bands and ESOP | Founder-set; benchmark; advisor     | Benchmark and document before offers         | Founders | Dec 2026 | Open   |
| OD-54 | Future hire triggers        | Fixed dates; school/ticket triggers | Use triggers in `17-team-and-hiring-plan.md` | Founders | Jun 2027 | Open   |

## 8. Pilot Inputs

| ID    | Decision                                | Needed for                     | Owner                | Deadline | Status |
| ----- | --------------------------------------- | ------------------------------ | -------------------- | -------- | ------ |
| OD-55 | Pilot school profiles and signed LOIs   | Configuration, dates, language | Founders             | Jan 2027 | Open   |
| OD-56 | Pilot fee structures and opening dues   | Migration                      | School accountant    | Mar 2027 | Open   |
| OD-57 | Pilot report-card samples               | Templates                      | School academic head | Apr 2027 | Open   |
| OD-58 | Pilot payroll components and CA contact | Payroll                        | School HR/CA         | Apr 2027 | Open   |
| OD-59 | Pilot branding assets                   | Onboarding                     | School               | Mar 2027 | Open   |
| OD-60 | Pilot device and network profile        | Offline testing                | School IT            | Apr 2027 | Open   |

## 9. Decisions Already Locked

These are recorded for reference and should not be reopened without a written change:

- Multi-tenant shared database with RLS
- Modular monolith on Cloud Run
- GCP Mumbai
- Cloudflare Worker routing with origin secret
- Better Auth
- Cloud Tasks + outbox
- Expo one-codebase, two apps
- Offline attendance only
- Single-zone Cloud SQL until 10 schools
- Shared-project staging with isolation guardrails
- Chromium PDF worker
- REST/OpenAPI
- Razorpay, Resend, MSG91, WhatsApp BSP, FCM
- Beta June 2027, GA October 2027, stabilization Nov–Dec 2027
- ₹15–30k monthly GCP/vendor budget excluding messaging/payment fees

## 10. Decision Template

```markdown
### OD-XX: Title

- **Status:** Open | Decided | Deferred | Superseded
- **Owner:**
- **Deadline:**
- **Context:**
- **Options:**
  1. Option A — pros/cons
  2. Option B — pros/cons
- **Recommendation:**
- **Decision:**
- **Date:**
- **Consequences:**
- **Documents updated:**
```

## 11. Related Documents

- [01-product-vision-and-scope.md](01-product-vision-and-scope.md)
- [16-delivery-roadmap.md](16-delivery-roadmap.md)
- [17-team-and-hiring-plan.md](17-team-and-hiring-plan.md)
- [19-risk-register.md](19-risk-register.md)
