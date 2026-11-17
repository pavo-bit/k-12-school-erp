# Technology Stack

**Status:** Baseline  
**Owner:** Engineering  
**Related:** [04-system-architecture.md](04-system-architecture.md), [20-engineering-standards.md](20-engineering-standards.md), [22-local-development.md](22-local-development.md)

---

## 1. Stack Principles

1. **One language across web, API, workers, and mobile.** TypeScript everywhere reduces context switching and hiring complexity.
2. **Boring, well-documented technology.** Prefer mature tools with large communities over novelty.
3. **Managed services over self-hosted infrastructure.** The team should not operate databases, queues, or mail servers.
4. **Explicit contracts.** Zod schemas and generated OpenAPI types are the boundary between web, mobile, and workers.
5. **Pin and automate upgrades.** Versions are locked; upgrades are planned work, not incidental.
6. **Escape hatches allowed.** Raw SQL is acceptable for reporting and performance-critical paths.

## 2. Core Stack

| Layer           | Choice                          | Indicative version     | Notes                                                          |
| --------------- | ------------------------------- | ---------------------- | -------------------------------------------------------------- |
| Language        | TypeScript                      | 5.x                    | `strict`, `noUncheckedIndexedAccess`                           |
| Runtime         | Node.js LTS                     | 22 or newer LTS        | Pinned in `.nvmrc`, Dockerfile, and CI                         |
| Package manager | pnpm                            | 9+                     | Workspace protocol, frozen lockfile in CI                      |
| Monorepo        | Turborepo                       | Current stable         | Task graph and remote cache optional                           |
| Web framework   | Next.js App Router              | 15+                    | Server components, route handlers, streaming                   |
| UI runtime      | React                           | 19+                    | Matches Next.js requirement                                    |
| Styling         | Tailwind CSS                    | 4.x                    | Design tokens via CSS variables                                |
| Components      | shadcn/ui + Radix               | Current                | Copied into repo, not a black-box dependency                   |
| Icons           | Lucide                          | Current                | Consistent stroke style                                        |
| Forms           | React Hook Form + Zod           | Current                | Shared schemas between client and server                       |
| Tables          | TanStack Table                  | v8                     | Server-side pagination and sorting                             |
| Charts          | Recharts                        | Current                | Dashboard and report visuals                                   |
| Database        | PostgreSQL                      | 16                     | Aurora Serverless v2; local Docker image matches major version |
| ORM / query     | Drizzle ORM + SQL               | Current                | Typed schema, SQL-first migrations                             |
| Migrations      | Drizzle Kit + custom SQL        | Current                | Expand/contract, reviewed in PRs                               |
| Auth            | Better Auth                     | Current                | Postgres adapter, sessions, OTP, TOTP                          |
| Validation      | Zod                             | 3.x/4.x                | All external input validated                                   |
| API docs        | OpenAPI 3.1                     | —                      | Generated from Zod/route metadata                              |
| Background jobs | SQS + Lambda                    | —                      | Transactional outbox                                           |
| PDF             | Chromium + `puppeteer-core`     | Chromium stable        | Dedicated `pdf-worker`                                         |
| Email templates | React Email                     | Current                | Rendered server-side                                           |
| Mobile          | Expo + React Native             | SDK current at kickoff | One codebase, two app variants                                 |
| Mobile routing  | Expo Router                     | Current                | File-based navigation                                          |
| Mobile state    | TanStack Query + Zustand        | Current                | Server cache + small local UI state                            |
| Mobile storage  | Expo SQLite + SQLCipher         | Current                | Encrypted attendance cache                                     |
| Secure storage  | Expo SecureStore                | Current                | Tokens and keys                                                |
| Push            | Firebase Cloud Messaging        | —                      | `expo-notifications` + FCM                                     |
| Payments        | Razorpay                        | —                      | Orders, checkout SDK, webhooks, refunds                        |
| Email           | Resend                          | —                      | Verified domain, SPF/DKIM/DMARC                                |
| SMS             | MSG91                           | —                      | DLT entity, sender ID, templates                               |
| WhatsApp        | BSP (TBD)                       | —                      | Approved templates, webhooks                                   |
| Error tracking  | Sentry                          | —                      | Web, worker, mobile                                            |
| Logging/metrics | Google Cloud Logging/Monitoring | —                      | Structured JSON logs                                           |
| IaC             | Terraform                       | 1.9+                   | Remote state in GCS                                            |
| CI/CD           | GitHub Actions                  | —                      | OIDC to GCP, no long-lived keys                                |
| Testing         | Vitest, Playwright, Maestro, k6 | Current                | Unit, E2E, mobile, load                                        |
| Lint/format     | ESLint, Prettier                | Current                | Pre-commit hooks via Husky + lint-staged                       |
| API client      | Typed fetch wrapper             | In-house               | Generated from OpenAPI where practical                         |
| i18n web        | next-intl                       | Current                | App Router integration                                         |
| i18n mobile     | i18next + react-i18next         | Current                | Device language and in-app switch                              |
| Dates           | date-fns + date-fns-tz          | Current                | `Asia/Kolkata` default                                         |
| Money           | Integer paise + helper module   | In-house               | No floating point                                              |
| IDs             | UUIDv7                          | —                      | Time-sortable, generated in app                                |
| Search          | PostgreSQL `pg_trgm` + indexes  | —                      | No separate search cluster at launch                           |

## 3. Why These Choices

### TypeScript monorepo

A small team benefits from shared types, shared validation, and one toolchain. The web app, API, workers, and mobile client can reuse contracts without publishing packages.

### Next.js on Cloud Run

Next.js provides server rendering, routing, and API handlers in one deployable. Cloud Run gives managed scaling, revisions, and traffic splitting without a Kubernetes control plane. The app is containerized, so it is not tied to a proprietary hosting model.

### PostgreSQL with RLS

Postgres offers transactions, constraints, JSONB, full-text and trigram search, and Row Level Security. A shared database with `school_id` and RLS is cheaper and simpler than schema-per-tenant or database-per-tenant at 20 schools.

### Drizzle over a heavier ORM

Drizzle keeps SQL visible, supports typed queries, and does not hide transaction or RLS behavior. Reporting queries can drop to raw SQL without fighting an abstraction.

### Better Auth

Better Auth provides email/password, sessions, OTP, TOTP, and a Postgres adapter without a vendor dependency. It fits the requirement for in-house control and mobile token flows.

### Cloud Tasks over a self-hosted queue

Cloud Tasks provides retries, scheduling, rate limits, and OIDC-authenticated delivery to Cloud Run. It removes the need to operate Redis, RabbitMQ, or a worker fleet.

### Expo over bare React Native

Expo provides a managed build and update workflow, a mature module ecosystem, and a single codebase for two app variants. Native modules remain possible through config plugins or a prebuild.

### Chromium PDF worker

Report cards, receipts, and payslips are HTML/CSS-heavy. Chromium gives consistent rendering, Devanagari support, and template flexibility compared with low-level PDF libraries.

## 4. Versions and Upgrade Policy

- The project pins exact versions in `pnpm-lock.yaml` and Dockerfiles.
- Renovate or Dependabot opens grouped upgrade PRs weekly.
- Patch and minor upgrades merge after CI passes.
- Major framework upgrades are planned quarterly and require a short design note.
- Node major upgrades follow the LTS schedule with a two-week staging soak.
- PostgreSQL major upgrades are planned with a maintenance window and tested restore.
- Mobile SDK upgrades are tested on a physical low-end Android device before release.
- Security patches are expedited regardless of the normal cadence.

## 5. Rejected Alternatives

| Alternative                       | Why not now                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Separate NestJS API + React SPA   | More deployables, more contracts, no benefit at this scale                   |
| Microservices                     | Operational overhead exceeds team capacity                                   |
| Database per school               | Migration and connection overhead at 20–50 schools                           |
| Schema per school                 | Migration fan-out and tooling complexity                                     |
| MongoDB                           | Financial invariants and reporting favor relational constraints              |
| Prisma                            | Excellent tool, but less transparent for RLS and complex SQL; Drizzle chosen |
| Auth0/Clerk                       | Recurring cost and vendor lock-in; in-house auth is feasible                 |
| Firebase Auth                     | Weak fit for school-scoped roles and Postgres joins                          |
| Redis                             | Not needed for launch; Postgres and Cloud Tasks cover the use cases          |
| Elasticsearch                     | Postgres search is sufficient at 20,000 students                             |
| Self-hosted SMTP                  | Deliverability and operations burden                                         |
| Self-managed Kubernetes           | No operational capacity for it                                               |
| Native Kotlin/Swift apps          | Two codebases; Expo meets launch needs                                       |
| EAS-hosted builds only            | Cost and control; local Gradle + GitHub Actions chosen                       |
| wkhtmltopdf                       | Unmaintained, poor CSS support                                               |
| React PDF                         | Limited layout control for complex report cards                              |
| Serverless functions per endpoint | Fragmented deployment and cold-start overhead                                |

## 6. External Dependencies and Exit Strategy

| Vendor       | Used for                   | Exit path                                                               |
| ------------ | -------------------------- | ----------------------------------------------------------------------- |
| GCP          | Compute, DB, storage, jobs | Containerized app and standard Postgres; Terraform portable with effort |
| Cloudflare   | DNS, TLS, WAF, routing     | DNS and Worker logic are reproducible; origin secret can be replaced    |
| Razorpay     | Payments                   | Adapter interface; another PSP can be added                             |
| Resend       | Email                      | SMTP/API adapter; templates remain in repo                              |
| MSG91        | SMS                        | Provider adapter; DLT registration is the lock-in                       |
| WhatsApp BSP | WhatsApp                   | Adapter; Meta Cloud API is fallback                                     |
| FCM          | Push                       | Standard mobile push; APNs later                                        |
| Sentry       | Errors                     | OpenTelemetry-compatible events; replaceable                            |
| GitHub       | Source, CI                 | Standard Git; workflows are portable with edits                         |

Provider adapters live in `packages/modules/communication/providers` and `packages/modules/fees/providers`. They expose a small internal interface, normalize errors, and record raw provider responses for support.

## 7. Browser and Device Support

| Surface        | Support                                                        |
| -------------- | -------------------------------------------------------------- |
| Web            | Current Chrome, Edge, Firefox, Safari; last two major versions |
| Responsive     | 360px to 1920px; admin optimized for 1280px+                   |
| Android        | 9 (API 28) and above                                           |
| iOS            | Post-GA, iOS 15 and above                                      |
| Low-end target | 3 GB RAM Android device, 720p screen                           |
| Network        | 3G and intermittent connectivity for attendance                |

## 8. Local Tooling

| Tool           | Purpose                                   |
| -------------- | ----------------------------------------- |
| Node.js LTS    | Runtime                                   |
| pnpm           | Packages and workspaces                   |
| Docker Desktop | Local Postgres, optional container builds |
| PostgreSQL 16  | Local database via Docker                 |
| Drizzle Kit    | Migration generation and studio           |
| Android Studio | Emulator and SDK for mobile               |
| JDK 17         | Android Gradle builds                     |
| Expo CLI       | Mobile development                        |
| Terraform CLI  | Infrastructure                            |
| gcloud CLI     | GCP authentication and Cloud SQL proxy    |
| GitHub CLI     | PRs and Actions                           |
| k6             | Load tests                                |
| Maestro        | Mobile E2E                                |

## 9. Dependency Policy

- New runtime dependencies require a short justification in the PR: purpose, maintenance status, license, bundle or image impact.
- No dependency with a copyleft license that conflicts with commercial SaaS distribution unless reviewed.
- Prefer libraries with active maintenance and a security policy.
- Avoid dependencies for trivial utilities.
- Lockfile changes are reviewed like code.
- `pnpm audit` runs in CI; high and critical findings block release unless waived with a documented reason.

## 10. Related Documents

- [04-system-architecture.md](04-system-architecture.md)
- [06-aws-infrastructure.md](06-aws-infrastructure.md)
- [13-cicd-and-release-management.md](13-cicd-and-release-management.md)
- [20-engineering-standards.md](20-engineering-standards.md)
- [22-local-development.md](22-local-development.md)
