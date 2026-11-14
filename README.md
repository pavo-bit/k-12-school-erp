# School ERP

Multi-tenant, India-first K-12 school ERP SaaS for day schools.

- **Documentation:** [documentation/README.md](documentation/README.md)
- **Build plan:** [documentation/25-build-plan.md](documentation/25-build-plan.md)
- **Open decisions:** [documentation/23-open-decisions.md](documentation/23-open-decisions.md)

## Stack

TypeScript, pnpm, Turborepo, Next.js, Fastify, Expo, PostgreSQL, Drizzle, Better Auth, Cloud Run, Cloudflare.

## Local development

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web: http://localhost:3000
- Worker: http://localhost:3001
- PDF worker: http://localhost:3002
- Drizzle Studio: `pnpm db:studio`

See [documentation/22-local-development.md](documentation/22-local-development.md) for the full setup, including Android and GCP access.

## Commands

| Command           | Purpose                         |
| ----------------- | ------------------------------- |
| `pnpm dev`        | Run all apps via Turborepo      |
| `pnpm build`      | Build all packages              |
| `pnpm typecheck`  | TypeScript across the workspace |
| `pnpm lint`       | ESLint                          |
| `pnpm format`     | Prettier write                  |
| `pnpm test`       | Unit tests                      |
| `pnpm db:migrate` | Apply migrations                |
| `pnpm db:reset`   | Drop, recreate, migrate, seed   |

## AI assistance

Project skills live in `.opencode/skills/` and are auto-discovered by OpenCode. CodeGraph is configured via `opencode.jsonc` and indexed in `.codegraph/`.

Useful commands:

```powershell
pnpm codegraph:status
pnpm codegraph:sync
pnpm codegraph:query <symbol>
```

## Repository layout

See [documentation/20-engineering-standards.md](documentation/20-engineering-standards.md) section 2.
