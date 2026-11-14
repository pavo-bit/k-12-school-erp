# Local Development

**Status:** Baseline  
**Owner:** Engineering  
**Related:** [05-tech-stack.md](05-tech-stack.md), [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md), [12-testing-and-quality.md](12-testing-and-quality.md), [20-engineering-standards.md](20-engineering-standards.md)

---

## 1. Goal

A new engineer should go from a clean machine to a running web app, worker, and Android emulator in under one hour, using synthetic data and no production access.

## 2. Prerequisites

| Tool              | Version              | Notes                                |
| ----------------- | -------------------- | ------------------------------------ |
| Node.js           | 22 LTS or newer      | Use `.nvmrc`; `nvm use` or `fnm use` |
| pnpm              | 9+                   | `corepack enable`                    |
| Git               | Current              | Configure name and email             |
| Docker Desktop    | Current              | Postgres and optional services       |
| PostgreSQL client | 16                   | `psql` for debugging                 |
| Android Studio    | Current              | SDK, emulator, platform tools        |
| JDK               | 17                   | Required by Android Gradle           |
| Expo CLI          | Via `pnpm exec expo` | No global install required           |
| gcloud CLI        | Current              | Optional; staging access only        |
| Terraform         | 1.9+                 | Optional; infrastructure work        |
| GitHub CLI        | Current              | Optional; PRs and Actions            |
| VS Code           | Current              | Recommended editor                   |

Windows: use PowerShell 7 and keep the repo on a local drive. WSL2 is optional; Android builds run on Windows.

## 3. First-Time Setup

```powershell
git clone <repository-url> School-ERP
cd School-ERP
corepack enable
pnpm install
Copy-Item .env.example .env
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:3000/api/v1`
- Worker: `http://localhost:3001`
- PDF worker: `http://localhost:3002`
- Drizzle Studio: `pnpm db:studio`
- Mail catcher: `http://localhost:8025` (if Mailpit is enabled)

## 4. Environment Variables

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable                   | Purpose                  | Local default                           |
| -------------------------- | ------------------------ | --------------------------------------- |
| `NODE_ENV`                 | Runtime mode             | `development`                           |
| `APP_ENV`                  | Environment name         | `local`                                 |
| `DATABASE_URL`             | Postgres connection      | `postgres://erp:erp@localhost:5432/erp` |
| `BETTER_AUTH_SECRET`       | Session signing          | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL`          | Auth base URL            | `http://localhost:3000`                 |
| `NEXT_PUBLIC_APP_URL`      | Web base URL             | `http://localhost:3000`                 |
| `ORIGIN_SECRET`            | Cloudflare origin header | `local-dev-secret`                      |
| `STORAGE_DRIVER`           | File storage             | `local`                                 |
| `LOCAL_STORAGE_PATH`       | Upload directory         | `./.local/storage`                      |
| `EMAIL_DRIVER`             | Email adapter            | `console`                               |
| `RESEND_API_KEY`           | Email                    | Empty locally                           |
| `SMS_DRIVER`               | SMS adapter              | `console`                               |
| `MSG91_AUTH_KEY`           | SMS                      | Empty locally                           |
| `WHATSAPP_DRIVER`          | WhatsApp adapter         | `console`                               |
| `RAZORPAY_KEY_ID`          | Payments                 | Test key                                |
| `RAZORPAY_KEY_SECRET`      | Payments                 | Test secret                             |
| `RAZORPAY_WEBHOOK_SECRET`  | Webhook verification     | Test secret                             |
| `FCM_SERVICE_ACCOUNT_JSON` | Push                     | Empty; push disabled locally            |
| `SENTRY_DSN`               | Error tracking           | Empty                                   |
| `LOG_LEVEL`                | Log verbosity            | `debug`                                 |
| `TZ`                       | Timezone                 | `Asia/Kolkata`                          |
| `FEATURE_FLAGS`            | Local overrides          | Empty                                   |

**Rules**

- Local adapters print emails/SMS to the console or Mailpit; they never call live providers.
- Razorpay test keys only.
- No real student, guardian, or staff data on a laptop.
- If a secret is committed, rotate it immediately.

## 5. Commands

| Command                        | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `pnpm dev`                     | Run web, worker, and pdf-worker via Turborepo   |
| `pnpm dev:web`                 | Run Next.js only                                |
| `pnpm dev:worker`              | Run worker only                                 |
| `pnpm dev:pdf`                 | Run PDF worker only                             |
| `pnpm build`                   | Build all packages                              |
| `pnpm typecheck`               | TypeScript across the workspace                 |
| `pnpm lint`                    | ESLint                                          |
| `pnpm format`                  | Prettier write                                  |
| `pnpm format:check`            | Prettier check                                  |
| `pnpm test`                    | Unit tests                                      |
| `pnpm test:watch`              | Unit tests in watch mode                        |
| `pnpm test:integration`        | Integration tests with Postgres                 |
| `pnpm test:e2e`                | Playwright web E2E                              |
| `pnpm test:mobile`             | Maestro mobile flows                            |
| `pnpm test:load`               | k6 load tests                                   |
| `pnpm db:generate`             | Generate a migration from schema changes        |
| `pnpm db:migrate`              | Apply migrations                                |
| `pnpm db:rollback`             | Roll back the last local migration (local only) |
| `pnpm db:reset`                | Drop, recreate, migrate, seed                   |
| `pnpm db:seed`                 | Seed reference data and demo school             |
| `pnpm db:studio`               | Drizzle Studio                                  |
| `pnpm storybook`               | Component explorer                              |
| `pnpm --filter mobile start`   | Expo dev server                                 |
| `pnpm --filter mobile android` | Build and run on Android                        |
| `pnpm --filter mobile ios`     | iOS (macOS only, post-GA)                       |

## 6. Database Workflow

### 6.1 Start Postgres

```powershell
docker compose up -d postgres
docker compose ps
```

The container exposes `5432` and persists data in a named volume.

### 6.2 Migrations

1. Edit the Drizzle schema in `packages/db/schema`.
2. Run `pnpm db:generate` and review the SQL.
3. Add RLS policies, constraints, and indexes in the same migration.
4. Run `pnpm db:migrate`.
5. Run integration tests.
6. Commit the schema and migration together.

**Never edit a merged migration.** Create a new one.

### 6.3 Seed data

`pnpm db:seed` creates:

- One organization and two schools (`greenwood`, `staging-demo`)
- A platform admin
- School admins, accountant, HR, teachers, and parents
- Classes, sections, subjects, and assignments
- Students and guardians
- Fee structures, invoices, and sample payments
- Attendance for the current week
- An exam and marks (for GA features)

Seed accounts use development-only passwords and are listed in `packages/db/seed/README.md`.

### 6.4 Reset

```powershell
pnpm db:reset
```

This drops the local database, recreates it, runs migrations, and seeds. It never touches staging or production.

## 7. Running the App

### 7.1 Web

`pnpm dev:web` starts Next.js with Turbopack. Tenant resolution in local development:

- `http://greenwood.localhost:3000`
- `http://staging-demo.localhost:3000`
- `http://localhost:3000` redirects to the default demo school

If `*.localhost` does not resolve on your OS, use the `?school=greenwood` development query parameter, which is disabled outside local.

### 7.2 Worker

`pnpm dev:worker` runs an HTTP server that accepts job payloads. In local mode, the outbox dispatcher runs in-process or via a local scheduler script:

```powershell
pnpm job:dispatch
```

Provider adapters use console/local drivers. No Cloud Tasks or SMS calls.

### 7.3 PDF worker

`pnpm dev:pdf` requires Chromium. Install it once:

```powershell
pnpm exec playwright install chromium
```

Set `CHROMIUM_EXECUTABLE_PATH` if the auto-detection fails. The worker exposes `POST /render` with a signed local payload.

### 7.4 Mobile

1. Install Android Studio, SDK 34+, and an emulator (Pixel 6, API 34).
2. Set `ANDROID_HOME` and add platform tools to `PATH`.
3. Start the Expo dev server:

```powershell
pnpm --filter mobile start
```

4. Press `a` for Android, or run `pnpm --filter mobile android`.
5. For a physical device, enable USB debugging and use `adb reverse tcp:3000 tcp:3000` so the app can reach the local API.
6. Set `EXPO_PUBLIC_API_URL` to your machine’s LAN IP for physical devices.

**Variants:**

```powershell
$env:APP_VARIANT="parent"; pnpm --filter mobile android
$env:APP_VARIANT="teacher"; pnpm --filter mobile android
```

The SQLCipher config plugin requires a development build; Expo Go is not sufficient for offline attendance.

## 8. Testing Locally

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm test:e2e
```

Integration tests need Postgres running. E2E tests start the web app automatically or use an already running instance; see `playwright.config.ts`.

Mobile E2E:

```powershell
pnpm test:mobile
```

Maestro requires a running emulator and an installed development build.

## 9. Working with GCP (Optional)

Most engineers do not need cloud access for daily work.

If you need staging data or logs:

```powershell
gcloud auth login
gcloud config set project school-erp-prod
gcloud auth application-default login
```

Cloud SQL access uses the Auth Proxy:

```powershell
cloud-sql-proxy school-erp-prod:asia-south1:erp-pg-prod --port 5433
```

Then set `DATABASE_URL` to `localhost:5433/erp_staging` with a read-only or staging user.

**Rules**

- Never connect to `erp_prod` from a laptop without written approval.
- Never run migrations against staging from a laptop; use the deploy pipeline.
- Never copy production data locally.
- Staging credentials are individual, not shared.

## 10. Editor Setup

Recommended VS Code extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Drizzle ORM (if available)
- Error Lens
- GitLens
- Android Studio is separate for native builds

Settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.eol": "\n"
}
```

## 11. Common Tasks

### Add a new module

1. Create `packages/modules/<name>` with domain, service, repository, routes, schemas, events, tests.
2. Export the public surface from `index.ts`.
3. Add the route registration in `apps/web`.
4. Add permissions and seed roles.
5. Add RLS for new tables.
6. Add module README and requirement IDs.
7. Add tests and OpenAPI tags.

### Add an API endpoint

1. Define the Zod request/response schema in `packages/contracts`.
2. Implement the service method with authorization.
3. Add the route handler and error mapping.
4. Add idempotency if it mutates money or bulk data.
5. Add integration, authz, and contract tests.
6. Regenerate OpenAPI and typed clients.
7. Update `09-api-contracts.md` if the contract is significant.

### Add a migration

1. Change the schema.
2. `pnpm db:generate`.
3. Review SQL for locks, defaults, and backfills.
4. Add RLS and indexes.
5. Test from empty and from a snapshot.
6. Document the roll-forward plan.

### Add a notification

1. Add the template key and channel.
2. Add variables and validation.
3. Add the event trigger in the domain transaction (outbox).
4. Add the worker handler and provider adapter.
5. Add delivery tests and cost tracking.
6. Register DLT/WhatsApp templates where required.

## 12. Troubleshooting

| Problem                          | Fix                                                                       |
| -------------------------------- | ------------------------------------------------------------------------- |
| `pnpm` not found                 | `corepack enable` and reopen the terminal                                 |
| Node version mismatch            | `nvm use` or `fnm use`; check `.nvmrc`                                    |
| Postgres port in use             | Stop the local service or change the Docker port                          |
| Migration fails with RLS error   | Ensure `app.current_school_id` is set in tests; check policy syntax       |
| `*.localhost` does not resolve   | Use the development school query parameter                                |
| Android build fails on JDK       | Set `JAVA_HOME` to JDK 17                                                 |
| Expo Go cannot run SQLCipher     | Use a development build; Expo Go lacks the native module                  |
| Physical device cannot reach API | Use LAN IP and `EXPO_PUBLIC_API_URL`; check firewall                      |
| Chromium not found for PDF       | Run `pnpm exec playwright install chromium` or set the executable path    |
| Prisma/Drizzle types stale       | `pnpm db:generate` and restart the TS server                              |
| Windows path issues              | Use PowerShell, forward slashes in configs, avoid OneDrive-synced folders |
| Line ending changes              | Set `files.eol` to `\n`; repo uses `.gitattributes`                       |
| Tests fail with tenant context   | Set the test school and use the shared helper                             |
| Emulator slow                    | Enable hardware acceleration; use an x86_64 image                         |

## 13. Security Rules for Local Development

- Synthetic data only.
- Test payment keys only.
- No live SMS/WhatsApp; use console adapters.
- Do not disable auth or RLS to “make it work.”
- Do not commit `.env`, keystores, or service account files.
- Report a leaked secret immediately.
- Lock your machine; local databases contain mock PII.

## 14. Related Documents

- [05-tech-stack.md](05-tech-stack.md)
- [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md)
- [12-testing-and-quality.md](12-testing-and-quality.md)
- [20-engineering-standards.md](20-engineering-standards.md)
