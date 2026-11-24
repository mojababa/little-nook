# little-nook

A mobile-first web app for people who crochet: supplies, patterns, projects and what they earn. Next.js (App Router) + TypeScript, Postgres + Drizzle, Tailwind + shadcn/ui, next-intl.

## Prerequisites

- Node.js 24
- pnpm (the version pinned in `package.json` → `packageManager`; `corepack enable` picks it up)
- Docker, for the local Postgres

## Setup

```sh
pnpm install
cp .env.example .env.local     # defaults match compose.yaml
docker compose up -d --wait    # Postgres 17 on localhost:5433, with little_nook and little_nook_test
pnpm db:migrate                # apply migrations to the dev database
pnpm dev                       # http://localhost:3000
```

Compose publishes Postgres on port **5433** so it doesn't clash with a locally installed Postgres on 5432.

### Environment variables

| Variable            | Used by                                             |
| ------------------- | --------------------------------------------------- |
| `DATABASE_URL`      | The app and `pnpm db:*` scripts                     |
| `TEST_DATABASE_URL` | Integration tests (rebuilt from migrations per run) |

## Database and migrations

The schema lives in `src/db/schema.ts`; migrations are committed in `drizzle/`.

```sh
pnpm db:generate --name <change>   # after editing the schema: write a new migration
pnpm db:migrate                    # apply pending migrations to DATABASE_URL
pnpm db:studio                     # browse the dev database
```

Never edit an applied migration; generate a new one.

## Scripts

| Command                 | What it does                                                |
| ----------------------- | ----------------------------------------------------------- |
| `pnpm dev`              | Dev server                                                  |
| `pnpm build`            | Production build                                            |
| `pnpm lint`             | ESLint                                                      |
| `pnpm format`           | Prettier (write); `pnpm format:check` to check only         |
| `pnpm typecheck`        | Generate route types, then `tsc --noEmit`                   |
| `pnpm test`             | All Vitest tests (unit + integration)                       |
| `pnpm test:unit`        | Pure-module tests only (`src/**/*.test.ts`)                 |
| `pnpm test:integration` | Integration tests against Postgres (`src/**/*.int.test.ts`) |
| `pnpm test:e2e`         | Playwright against a production build (builds first)        |

Before the first `pnpm test:e2e`, install the browser: `pnpm exec playwright install chromium`.

> **Windows:** run builds and E2E from the folder's real casing (e.g. `D:\Projekti\…`, not `D:\projekti\…`). A mismatched drive path makes the bundler load React twice and every page fails to prerender with “Invalid hook call”.

## Conventions

### Domain service layer

Business logic lives in `src/server/<module>/` as plain functions taking a workspace context and an input:

```ts
export async function renameWorkspace(
  ctx: WorkspaceContext,
  input: { name: string },
): Promise<Result<undefined, "name-required">>;
```

- `WorkspaceContext` (`src/server/context.ts`) carries the database handle and the workspace id. Every query is scoped by `ctx.workspaceId`.
- Expected refusals (validation, rule violations) return a `Result` (`src/server/result.ts`); unexpected failures throw.
- Server actions and route handlers are thin adapters: derive the context from the session (`getDb()` from `@/db`), call the service, map the result to a response. No business logic in them.

### Tests

- **Integration tests** (`*.int.test.ts`, next to the module) call service functions against a real Postgres. Import `test` from `@tests/integration/fixtures`: it gives each test a fresh workspace as `ctx`. Use `createWorkspace()` for extra workspaces (e.g. isolation checks). The database is rebuilt from the committed migrations at the start of each run.
- **Unit tests** (`*.test.ts`) are for pure modules with no database.
- **E2E** (`e2e/*.spec.ts`) covers a few critical journeys only; business rules are tested at the service layer.

### i18n

All UI text comes from the message catalogues in `messages/` (English: `messages/en.json`) via next-intl: `useTranslations` / `getTranslations`. Message keys are type-checked against the English catalogue. There is no locale routing; the locale will come from the user's saved preference (see `src/i18n/request.ts`).

### UI components

shadcn/ui components are added with `pnpm dlx shadcn@latest add <component>` and live in `src/components/ui/`.

## CI

`.github/workflows/ci.yml` runs on pull requests to `main` and pushes to `main`: **lint** (ESLint + Prettier), **typecheck**, **test** (Postgres 17 service container, migrations applied), **e2e** (Playwright, Chromium, production build) and **build**. A newer run cancels a superseded one. Dependabot keeps npm packages and GitHub Actions up to date.
