# Security and Compliance

**Status:** Baseline  
**Owner:** Founders / Security lead  
**Related:** [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md), [08-data-model.md](08-data-model.md), [14-observability-and-operations.md](14-observability-and-operations.md), [19-risk-register.md](19-risk-register.md)

---

## 1. Security Objectives

1. **Protect children’s and families’ data.** Student PII is the highest-sensitivity asset.
2. **Prevent cross-tenant access.** No school can see another school’s data.
3. **Protect money.** Payments, refunds, and payroll are accurate, authorized, and auditable.
4. **Preserve availability.** Schools depend on the system during fixed daily windows.
5. **Meet Indian legal obligations.** DPDP Act 2023, tax record retention, and contractual duties.
6. **Be honest about maturity.** No certification claims until audited.

## 2. Scope

In scope:

- Web application, REST API, workers, PDF renderer
- Android parent and teacher apps
- GCP infrastructure, Cloudflare configuration, CI/CD
- Third-party integrations: Razorpay, Resend, MSG91, WhatsApp BSP, FCM
- Support and impersonation workflows
- Data at rest, in transit, and in backups
- People, process, and vendor management

Out of scope for year one:

- School-owned devices and local networks
- Biometric hardware
- CCTV
- School-side accounting systems
- Student-owned devices

## 3. Roles and Responsibilities

| Role             | Responsibility                                                   |
| ---------------- | ---------------------------------------------------------------- |
| Founders         | Security ownership, risk acceptance, incident commander rotation |
| Engineering lead | Secure SDLC, architecture review, vulnerability remediation      |
| All engineers    | Threat awareness, code review, tests, incident participation     |
| QA               | Security-relevant test coverage, tenant isolation verification   |
| Platform admin   | Access reviews, impersonation oversight, vendor configuration    |
| Privacy contact  | DPDP requests, notices, breach communication, vendor DPAs        |
| School admin     | User lifecycle, local policy, consent collection                 |
| GCP / Cloudflare | Infrastructure security under shared responsibility              |

## 4. Data Protection

| Data                              | Classification         | Controls                                                |
| --------------------------------- | ---------------------- | ------------------------------------------------------- |
| Student name, DOB, photo, address | Confidential           | TLS, encryption at rest, role scope, audit              |
| Guardian phone/email              | Confidential           | Masking in lists, role scope                            |
| Medical notes, category, religion | Restricted             | Need-to-know role, no bulk export by default            |
| Marks and report cards            | Confidential           | Teacher scope, publish workflow, audit                  |
| Invoices, payments, receipts      | Confidential/Financial | Immutable records, reconciliation, 8-year retention     |
| Salary, bank details, PAN, PF/ESI | Restricted             | Field-level KMS encryption, masking, payroll roles only |
| Passwords, OTPs, tokens           | Secret                 | Hashed, never logged, short-lived                       |
| Audit logs                        | Restricted             | Append-only, restricted read                            |
| Backups                           | Confidential           | Encrypted, access-controlled, restore-tested            |

**Handling rules**

- Collect only what a documented purpose requires.
- Do not put PII in URLs, analytics events, or error messages.
- Do not log request bodies for auth, payment, payroll, or document endpoints.
- Mask phone numbers and bank accounts in list views.
- Use signed, short-lived URLs for documents and generated files.
- Never store card data.
- Do not use production data in staging without anonymization and approval.

## 5. Threat Model

| Threat                | Example                                          | Primary controls                                               |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Tenant crossing       | Change an ID and read another school’s student   | RLS, server-side scope checks, IDOR tests                      |
| Origin bypass         | Call Cloud Run URL directly, skipping Cloudflare | Secret origin header, constant-time check, ingress tests       |
| Broken access control | Teacher opens unassigned section                 | Resource-level authorization, tests                            |
| Authentication abuse  | OTP brute force, credential stuffing             | Rate limits, attempt caps, lockouts, MFA for admins            |
| Session theft         | Stolen cookie or refresh token                   | HttpOnly/Secure cookies, rotation, reuse detection, revocation |
| Payment forgery       | Forged Razorpay webhook                          | Signature verification, raw body, event dedupe                 |
| Payment tampering     | Client changes amount                            | Server-side amount validation against invoices                 |
| Injection             | SQL, NoSQL, template, CSV injection              | Parameterized queries, Zod validation, output encoding         |
| XSS                   | Stored announcement script                       | React escaping, sanitization, CSP                              |
| SSRF                  | User-supplied URL fetched by server              | No arbitrary URL fetching; allowlist providers                 |
| File upload abuse     | Malware or oversized document                    | Type/size limits, virus scan, private storage, no execution    |
| Data exfiltration     | Bulk export by insider                           | Role scope, export limits, audit, watermarking                 |
| Insider misuse        | Support views payroll                            | Impersonation controls, least privilege, access review         |
| Supply chain          | Malicious npm package                            | Lockfiles, audit, dependency review, minimal deps              |
| Secret leakage        | Key in repo or logs                              | Secret Manager, scanning, rotation                             |
| Denial of service     | Traffic spike or expensive query                 | Cloudflare, rate limits, max instances, query timeouts         |
| Lost device           | Stolen teacher phone                             | SecureStore, SQLCipher, remote revocation, app PIN             |
| Backup exposure       | Public bucket or leaked dump                     | Private buckets, IAM, encryption, restore audit                |
| Sub-processor breach  | Messaging vendor incident                        | DPAs, minimal data, vendor review, incident clauses            |
| Availability failure  | Single-zone DB outage                            | Backups, PITR, runbooks, HA trigger                            |

## 6. Security Controls

### 6.1 Identity and access

- MFA (TOTP) required for platform admins, school admins, principals, accountants, and HR/payroll.
- Password policy: 12+ characters, breached-password check, rate-limited login.
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix.
- Mobile tokens: short-lived access, rotating refresh, reuse detection.
- Least privilege for staff roles; custom roles at GA composed from permissions.
- Access review quarterly for platform admins and production access.
- Offboarding within one business day; immediate revocation on termination.
- Impersonation time-bound, logged, and blocked from sensitive actions.

### 6.2 Application security

- OWASP ASVS Level 2 as the design target.
- All input validated with Zod at the boundary.
- Parameterized SQL only; no string-built queries.
- Output encoded by React; rich text sanitized with an allowlist.
- CSRF protection for cookie-authenticated mutations.
- Security headers: HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame ancestors denied.
- File uploads: allowlisted MIME types, size limits, malware scan, private storage, content-disposition attachment.
- CSV exports escape formula-leading characters.
- Open redirects prevented with allowlisted paths.
- Error responses do not leak stack traces or internal IDs.
- Rate limits on auth, OTP, payments, exports, and public forms.
- Idempotency on financial mutations.
- No dangerous deserialization; JSON only.

### 6.3 Data and encryption

- TLS 1.2+ everywhere; HSTS with preload after domain confirmation.
- Encryption at rest: Cloud SQL, GCS, backups.
- Field-level KMS encryption for bank details and statutory IDs.
- Argon2id password hashing.
- OTPs and refresh tokens hashed at rest.
- Signed URLs expire in 5–15 minutes.
- Database not publicly accessible.
- Secrets in Secret Manager, injected at runtime, never in images or env files.
- Key rotation: application secrets annually or on suspicion; KMS keys per policy.

### 6.4 Infrastructure

- Private Cloud SQL; Direct VPC egress.
- Cloud Run services use dedicated service accounts.
- No service account keys; Workload Identity Federation for CI.
- Cloudflare WAF, rate limiting, and bot protections.
- Origin secret rotated quarterly and on suspicion.
- Production access limited to founders; console actions logged.
- Terraform state access restricted.
- Artifact Registry image scanning enabled.
- Container images run as non-root, read-only filesystem where possible.
- No SSH into production; no long-running VMs.

### 6.5 Monitoring and detection

- Alerts for auth anomalies, cross-tenant denials, payment webhook failures, export spikes, and admin actions.
- Audit log for sensitive operations.
- Sentry for application errors.
- Cloud Audit Logs for infrastructure changes.
- Weekly review of failed logins, impersonations, and exports during beta.

### 6.6 Backup and recovery

- Daily backups, 7-day PITR, 30-day retention.
- Encrypted backups.
- Restore drills before beta and GA, then quarterly.
- Documented RPO 15 minutes and RTO 4 hours pre-HA.
- Backup access restricted and audited.

## 7. Secure Development Lifecycle

| Stage        | Practice                                                                          |
| ------------ | --------------------------------------------------------------------------------- |
| Design       | Threat model for new modules and integrations; ADR for security-relevant choices  |
| Development  | Secure coding standards, input validation, parameterized queries, secret scanning |
| Review       | Mandatory peer review; security checklist for auth, payments, files, exports      |
| CI           | Type checks, lint, tests, dependency audit, secret scan, SAST                     |
| Pre-release  | DAST against staging, tenant isolation suite, dependency review                   |
| Release      | Change approval, rollback plan, feature flags for risky changes                   |
| Post-release | Monitoring, incident review, patch SLAs                                           |

**Vulnerability SLAs**

| Severity | Fix target                      |
| -------- | ------------------------------- |
| Critical | 24–48 hours; hotfix or rollback |
| High     | 7 days                          |
| Medium   | 30 days                         |
| Low      | 90 days                         |

## 8. DPDP Act 2023 Compliance

This section is a planning baseline, not legal advice. Counsel must review before GA.

### 8.1 Roles

- The **school** is the Data Fiduciary: it determines why and how student data is processed.
- The **platform** is a Data Processor acting on the school’s instructions, except for limited platform purposes such as security, billing, and support.
- Vendors (Razorpay, Resend, MSG91, WhatsApp BSP, GCP, Cloudflare, Sentry) are sub-processors.
- A Data Processing Agreement is required with each school and each sub-processor.

### 8.2 Obligations and implementation

| Obligation                 | Implementation                                                                |
| -------------------------- | ----------------------------------------------------------------------------- |
| Lawful purpose and consent | School collects consent; platform records purpose, timestamp, and withdrawal  |
| Notice                     | School-facing template and parent-app privacy notice                          |
| Data minimization          | Only required fields; optional fields clearly marked                          |
| Accuracy                   | Profile correction requests; school approval for sensitive fields             |
| Storage limitation         | Retention schedule in `08-data-model.md`; automated archival/purge            |
| Security safeguards        | Controls in this document                                                     |
| Breach notification        | Incident process with school and authority notification support               |
| Grievance redressal        | Support contact, response SLA, escalation to privacy contact                  |
| Children’s data            | Verifiable parental consent via school; no behavioral advertising or tracking |
| Data principal rights      | Access, correction, erasure, grievance, nomination workflow                   |
| Cross-border transfer      | Primary data stored in India; no transfer without legal review                |
| Record keeping             | Processing register, vendor list, DPA records                                 |

### 8.3 Children’s data

- The platform does not serve ads, build behavioral profiles, or sell data.
- Consent for a child is obtained by the school from the parent/guardian.
- Tracking is limited to operational analytics with no ad identifiers.
- Report cards and attendance are shared only with linked guardians.
- Age-appropriate design: no public child profiles, no social features.

### 8.4 Data principal requests

1. Receive request via school or support.
2. Verify identity and guardian relationship.
3. Determine whether the school or platform must act.
4. Fulfil access/correction within the committed SLA (target 30 days).
5. For erasure, apply retention exceptions and document the decision.
6. Record the request, actions, and response.
7. Notify the school when the request concerns school-controlled data.

### 8.5 Vendor management

- Maintain a sub-processor list with purpose, data categories, and location.
- Execute DPAs with confidentiality, security, breach notification, and deletion clauses.
- Review vendors annually and before adding a new one.
- Prefer India-region processing; document any exception.
- Notify schools of material sub-processor changes where required.

## 9. Incident Response

### 9.1 Severity

| Severity | Definition                                                                   | Examples                                   |
| -------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| P1       | Confirmed data breach, cross-tenant exposure, payment integrity, full outage | RLS failure, leaked bucket, double charges |
| P2       | Major feature down, security vulnerability actively exploitable              | Payments down, auth outage                 |
| P3       | Partial degradation, single-school issue                                     | Notifications delayed, PDF failures        |
| P4       | Minor bug or cosmetic                                                        | UI issue                                   |

### 9.2 Process

1. **Detect and declare.** On-call acknowledges within 15 minutes for P1, 1 hour for P2.
2. **Contain.** Revoke sessions/keys, disable a feature flag, block an IP, or isolate a service.
3. **Assess.** Determine affected schools, data categories, and time window.
4. **Communicate.** Internal updates every 30 minutes for P1; school notification within the contractual window; legal/privacy contact engaged.
5. **Eradicate and recover.** Patch, restore, verify integrity, monitor.
6. **Notify.** Support the school’s DPDP notification obligations; do not notify data principals directly unless instructed or legally required.
7. **Review.** Post-incident report within five working days; actions tracked to closure.

### 9.3 Evidence

- Preserve logs, audit records, database snapshots, and provider payloads.
- Chain of custody for any exported evidence.
- Do not delete affected data until the investigation permits.

### 9.4 Breach notification readiness

- Maintain a template for school notification.
- Maintain a data map to identify affected records.
- Legal counsel confirms whether notification to the Data Protection Board is required.
- Document timelines and decisions.

## 10. Penetration Testing

**Before GA:**

- External web/API test by an independent firm.
- Mobile app static and dynamic review.
- Tenant isolation and authorization focus.
- Payment and webhook security.
- Infrastructure and IAM review.
- Social engineering optional.

**Scope:** production-like staging with synthetic data; no production testing without written approval and a window.

**Deliverables:** findings with CVSS, reproduction, evidence, remediation guidance, retest.

**Exit criteria:** no open critical or high findings; medium findings have accepted remediation dates.

**Budget:** separate one-time cost, not in the monthly cloud budget.

## 11. Access Management and Reviews

- Production access via Google Groups; no shared accounts.
- MFA on Google accounts and GitHub.
- Quarterly review of:
  - Platform admin accounts
  - GCP IAM roles
  - GitHub organization members
  - Cloudflare members
  - Vendor accounts
- Immediate removal on role change or exit.
- Break-glass access requires a reason and is reviewed within 24 hours.

## 12. Training and Awareness

- Onboarding security briefing for every engineer.
- Annual refresher on DPDP, phishing, and incident reporting.
- Secure coding checklist for auth, payments, files, and exports.
- Tabletop incident exercise before beta.

## 13. Compliance Roadmap

| Milestone | Activity                                                                 |
| --------- | ------------------------------------------------------------------------ |
| Dec 2026  | Privacy policy draft, DPA template, vendor list, data map                |
| Jan 2027  | Security headers, rate limits, secret scanning, dependency audit in CI   |
| Mar 2027  | Tenant isolation suite, auth review, backup restore drill                |
| May 2027  | Incident tabletop, DPA signed with pilot schools, mobile security review |
| Aug 2027  | External penetration test, DAST, remediation                             |
| Sep 2027  | Retest, DPDP documentation review, GA security sign-off                  |
| Post-GA   | Consider ISO 27001 readiness or SOC 2 based on customer demand           |

**Certifications:** none at launch. Do not claim ISO 27001, SOC 2, or “bank-grade” security until independently audited.

## 14. Open Security Items

| Item                                                           | Owner    | Deadline |
| -------------------------------------------------------------- | -------- | -------- |
| Draft privacy policy and DPA with counsel                      | Founders | Jan 2027 |
| Confirm breach notification timelines and wording              | Counsel  | Feb 2027 |
| Select penetration-test vendor and budget                      | Founders | May 2027 |
| Decide log retention against legal advice                      | Founders | Feb 2027 |
| Confirm whether any pilot requires data residency beyond India | Founders | Mar 2027 |
| Define support access policy for school data                   | Founders | Apr 2027 |

## 15. Related Documents

- [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md)
- [08-data-model.md](08-data-model.md)
- [12-testing-and-quality.md](12-testing-and-quality.md)
- [14-observability-and-operations.md](14-observability-and-operations.md)
- [19-risk-register.md](19-risk-register.md)
