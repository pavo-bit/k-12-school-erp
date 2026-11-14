# School ERP — Documentation

**Status:** Baseline v1.0  
**Last updated:** 14 November 2026  
**Owner:** Founders  
**Audience:** Founders, in-house engineers, QA, designers, future hires, implementation partners, advisors

---

## What This Documentation Covers

This folder is the working source of truth for the School ERP project. It captures the agreed product plan, technical architecture, delivery model, operating model, and the decisions still open before implementation.

The project is a **multi-tenant, India-first, K-12 school ERP SaaS** built entirely in-house on **GCP Mumbai**, with **Next.js/TypeScript**, **Cloud Run**, **Cloud SQL PostgreSQL**, **Cloudflare**, and **Expo mobile apps**.

**Planned delivery windows**

| Milestone                          | Target                 |
| ---------------------------------- | ---------------------- |
| Internal alpha                     | April 2027             |
| Pilot beta, 1–2 schools            | June 2027              |
| General availability, 5–10 schools | October 2027           |
| Stabilization, iOS, HA             | November–December 2027 |

---

## Document Map

### Product and scope

| Document                                                             | Purpose                                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [00-executive-summary.md](00-executive-summary.md)                   | One-page product, delivery, and budget summary                    |
| [01-product-vision-and-scope.md](01-product-vision-and-scope.md)     | Vision, target market, principles, release scope, success metrics |
| [02-personas-and-user-journeys.md](02-personas-and-user-journeys.md) | Personas and end-to-end user journeys                             |
| [03-functional-requirements.md](03-functional-requirements.md)       | Functional requirements index                                     |
| [modules/](modules/README.md)                                        | Detailed module specifications                                    |

### Architecture and engineering

| Document                                                                       | Purpose                                                            |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [04-system-architecture.md](04-system-architecture.md)                         | Context, containers, request flows, background jobs, failure modes |
| [05-tech-stack.md](05-tech-stack.md)                                           | Stack choices, versions, rationale, local tooling                  |
| [06-gcp-infrastructure.md](06-gcp-infrastructure.md)                           | GCP topology, services, IAM, environments, provisioning checklist  |
| [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md) | Tenant model, RLS, auth, RBAC, data scoping                        |
| [08-data-model.md](08-data-model.md)                                           | Entity model, conventions, critical tables, retention              |
| [09-api-contracts.md](09-api-contracts.md)                                     | REST API principles, auth, errors, endpoints, sync, webhooks       |
| [10-mobile-application.md](10-mobile-application.md)                           | Expo apps, offline sync, push, payments, builds, store release     |
| [11-security-and-compliance.md](11-security-and-compliance.md)                 | Threat model, controls, DPDP compliance, incident response         |

### Quality and operations

| Document                                                                     | Purpose                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [12-testing-and-quality.md](12-testing-and-quality.md)                       | Test strategy, suites, release gates, definition of done                 |
| [13-cicd-and-release-management.md](13-cicd-and-release-management.md)       | CI/CD, Terraform, migrations, canary, rollback, mobile releases          |
| [14-observability-and-operations.md](14-observability-and-operations.md)     | Logs, metrics, alerts, SLOs, on-call, runbooks, backups                  |
| [runbooks/](runbooks/README.md)                                              | Operational runbook index and template                                   |
| [15-cost-model.md](15-cost-model.md)                                         | GCP and vendor costs, HA trigger, scaling scenarios                      |
| [16-delivery-roadmap.md](16-delivery-roadmap.md)                             | Phases, dates, gates, dependencies, staffing                             |
| [25-build-plan.md](25-build-plan.md)                                         | Implementation structure, low-level design, database system, build order |
| [17-team-and-hiring-plan.md](17-team-and-hiring-plan.md)                     | Roles, responsibilities, hiring, onboarding, cadence                     |
| [18-pilot-onboarding-and-migration.md](18-pilot-onboarding-and-migration.md) | Pilot selection, data migration, cutover, training, success criteria     |
| [19-risk-register.md](19-risk-register.md)                                   | Risk register with owners and mitigations                                |

### Standards and reference

| Document                                                   | Purpose                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| [20-engineering-standards.md](20-engineering-standards.md) | Repo layout, coding standards, review, testing, documentation |
| [21-ui-ux-guidelines.md](21-ui-ux-guidelines.md)           | Design principles, system, accessibility, localization        |
| [22-local-development.md](22-local-development.md)         | Prerequisites, setup, environment, commands, troubleshooting  |
| [23-open-decisions.md](23-open-decisions.md)               | Decisions needed before build, with owners and deadlines      |
| [24-glossary.md](24-glossary.md)                           | Domain, technical, and India-specific terms                   |
| [adr/](adr/README.md)                                      | Architecture Decision Records                                 |

---

## Locked Baseline Decisions

| Area      | Decision                                                                   |
| --------- | -------------------------------------------------------------------------- |
| Product   | Multi-tenant K-12 day-school ERP SaaS, India-first                         |
| Tenancy   | Shared PostgreSQL database, `school_id`, Row Level Security                |
| Timeline  | 10–12 months; beta June 2027; GA October 2027                              |
| Team      | 3 full-time founders + 1 in-house mobile engineer + 1 in-house QA engineer |
| Cloud     | GCP Mumbai (`asia-south1`)                                                 |
| Web/API   | Next.js + TypeScript on Cloud Run                                          |
| Database  | Cloud SQL PostgreSQL, single-zone until 10 schools, then HA                |
| Jobs      | Cloud Tasks + Cloud Run workers; transactional outbox                      |
| Auth      | Better Auth + Postgres; web sessions; mobile JWT + refresh                 |
| Mobile    | One Expo/React Native codebase; Parent + Teacher apps; Android first       |
| Offline   | Attendance only, SQLCipher-encrypted local database                        |
| Routing   | `*.erp.com` via Cloudflare Worker + secret origin header                   |
| Edge      | Cloudflare free DNS, SSL, WAF, CDN                                         |
| Payments  | Razorpay / UPI                                                             |
| Messaging | Resend email, MSG91 SMS with DLT, WhatsApp BSP                             |
| Push      | Firebase Cloud Messaging                                                   |
| Builds    | GitHub Actions + local Gradle; iOS later                                   |
| Budget    | ₹15–30k/month GCP and vendors, excluding messaging usage and payment fees  |

---

## How to Use This Documentation

1. **New engineer:** read `00-executive-summary.md`, `01-product-vision-and-scope.md`, `04-system-architecture.md`, `05-tech-stack.md`, `20-engineering-standards.md`, and `22-local-development.md`.
2. **Product/design:** read `01`, `02`, `03`, `modules/`, and `21-ui-ux-guidelines.md`.
3. **Architecture/security review:** read `04`, `06`, `07`, `08`, `09`, `11`, and the ADRs.
4. **Operations:** read `06`, `13`, `14`, `15`, and `19`.
5. **Pilot onboarding:** read `16`, `17`, `18`, and `23`.

---

## Document Conventions

- **Must / should / may** follow RFC 2119 intent.
- **Beta** means the June 2027 pilot release.
- **GA** means the October 2027 general-availability release.
- **Post-GA** means work scheduled after October 2027.
- Dates are targets, not commitments, until the go/no-go gates are met.
- Code blocks labelled `mermaid` are diagrams; render them in GitHub, GitLab, or a compatible Markdown viewer.
- All monetary values are in Indian rupees unless stated otherwise.
- `₹` amounts for cloud services are estimates and must be verified with the GCP calculator before purchase.

---

## Change Control

| Change type                | Process                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Typo or clarification      | Direct pull request                                                                                            |
| Scope change               | Update `01-product-vision-and-scope.md`, `16-delivery-roadmap.md`, and `23-open-decisions.md`; record decision |
| Architecture change        | Add or supersede an ADR; update `04-system-architecture.md`                                                    |
| Security/compliance change | Update `11-security-and-compliance.md`; security review required                                               |
| Cost change                | Update `15-cost-model.md`; budget owner approval                                                               |
| New module                 | Add a module spec under `modules/`; update functional requirements index and roadmap                           |

---

## Current Open Inputs

The following are still unresolved and block final dates or setup:

- Domain name and ownership
- Regional language in addition to Hindi and English
- Pilot school profiles and signed LOIs
- Hiring start dates for mobile and QA engineers
- One-time budget for penetration testing and legal/DPDP documents
- GCP organization/billing access and vendor accounts

See [23-open-decisions.md](23-open-decisions.md) for owners and deadlines.
