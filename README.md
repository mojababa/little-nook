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

| Variable               | Used by                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`         | The app, `pnpm db:*` scripts and E2E                                                |
| `TEST_DATABASE_URL`    | Integration tests (rebuilt from migrations per run)                                 |
| `BETTER_AUTH_SECRET`   | Signs sessions and email links (required at runtime)                                |
| `BETTER_AUTH_URL`      | The app's public origin; defaults to the Vercel deployment URL, else `localhost`    |
| `RESEND_API_KEY`       | Sends verification and password-reset email through Resend (required in prod)       |
| `EMAIL_FROM`           | Sender address for that email, e.g. `Little Nook <hello@…>`                         |
| `EMAIL_OUTBOX_DIR`     | Without Resend: write emails as JSON files here instead of printing them to stdout  |
| `GOOGLE_CLIENT_ID`     | Google OAuth client for “Continue with Google”; off unless both Google vars are set |
| `GOOGLE_CLIENT_SECRET` | Its secret                                                                          |

Locally, without `RESEND_API_KEY`, verification and reset emails (with their links) are printed in the `pnpm dev` output.

### Google sign-in

“Continue with Google” needs an OAuth client from the [Google Cloud console](https://console.cloud.google.com/apis/credentials):

1. **OAuth consent screen** (Google Auth Platform → Branding): app name _Little Nook_, the app's home page, and the **Privacy Policy** and **Terms of Service** links: `<origin>/privacy` and `<origin>/terms`. Add the origin's domain under _Authorized domains_. Scopes: `openid`, `email`, `profile` only.
2. **Credentials → Create OAuth client ID → Web application**, with an _Authorized redirect URI_ per environment: `<origin>/api/auth/callback/google` (e.g. `http://localhost:3000/api/auth/callback/google` locally).
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Pages read them at build time to show the button, so redeploy after setting them.

Vercel previews get a new URL per deployment, which Google won't accept as a redirect URI, so Google sign-in only works on origins you have registered.

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

Before the first `pnpm test:e2e`, install the browser: `pnpm exec playwright install chromium`. E2E runs against `DATABASE_URL` (run `pnpm db:migrate` first) and signs up throwaway `@example.test` users there; the server writes its emails to `.e2e-outbox/`, where the tests read their links.

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
- Server actions and route handlers are thin adapters: derive the context from the session with `requireWorkspaceContext()` (`src/server/session.ts`), call the service, map the result to a response. No business logic in them.

### Auth and workspaces

- Better Auth (`src/server/auth/auth.ts`) handles email + password, email verification, password reset and Google sign-in; its endpoints are served at `/api/auth/*` and called from the browser through `src/lib/auth-client.ts`. A session only exists for a verified user.
- Signing up with email creates the user's personal workspace in the currency they picked, with them as `owner` (`workspace_members`). Signing up with Google creates the user without one: `requireWorkspaceContext()` (and so every app page) sends them to `/welcome` to choose the currency, which calls `setUpPersonalWorkspace()`.
- Account linking: continuing with Google links to an existing account with the same email only when Google and the account have both verified it; otherwise it fails with `account_not_linked` and creates nothing. Logged-in users link and unlink Google in settings (the Google address may differ); the only remaining way to log in can't be unlinked. The rules are tested in `src/server/auth/google.int.test.ts`. Every user has exactly one workspace for now; `workspaceContextForUser()` resolves it. It and `createPersonalWorkspace()` take a `db` rather than a context, because they run before there is one.
- `src/proxy.ts` redirects app routes to `/login` when there is no session cookie, but that is only an optimisation. **Every page, server action and route handler that reads or changes data calls `requireUser()` or `requireWorkspaceContext()` itself**, because layouts don't re-render on client-side navigation. Under Cache Components, those calls read the request, so the components making them sit inside `<Suspense>`.
- The app's sections are listed in `src/lib/app-sections.ts`; a new section also needs its path in the proxy matcher.

### Tests

- **Integration tests** (`*.int.test.ts`, next to the module) call service functions against a real Postgres. Import `test` from `@tests/integration/fixtures`: it gives each test a fresh workspace as `ctx`. Use `createWorkspace()` for extra workspaces (e.g. isolation checks). For auth flows, `createTestAuth()` gives an auth instance on the test database whose emails land in an in-memory `outbox`; sign up with `signUp()` (or `signUpVerified()`) and `uniqueEmail()`. For Google, `tests/integration/google.ts` fakes Google's token endpoint and gives a cookie-keeping `createBrowser(auth)` that can `continueWithGoogle()` and `linkGoogle()` as any `googleProfile()`. The database is rebuilt from the committed migrations at the start of each run.
- **Unit tests** (`*.test.ts`) are for pure modules with no database.
- **E2E** (`e2e/*.spec.ts`) covers a few critical journeys only; business rules are tested at the service layer.

### i18n

All UI text comes from the message catalogues in `messages/` (English: `messages/en.json`) via next-intl: `useTranslations` / `getTranslations`. Message keys are type-checked against the English catalogue. There is no locale routing; the locale will come from the user's saved preference (see `src/i18n/request.ts`).

### PWA

Little Nook is installable but online-only. The manifest is `src/app/manifest.ts`, icons live in `public/icons/` (plus `src/app/icon.svg`, `apple-icon.png` and `favicon.ico`), and the brand colours in `src/lib/brand.ts`. The service worker (`public/sw.js`, registered in production builds only) caches the app shell: the `/offline` page shown when a page can't load, and the build's static assets. It never caches page HTML or data and leaves non-GET requests alone. It is registered as `/sw.js?v=<build version>` (Vercel deployment ID, else the git commit; see `next.config.ts`), so each deploy installs a fresh worker and drops the previous build's caches.

### UI components

shadcn/ui components are added with `pnpm dlx shadcn@latest add <component>` and live in `src/components/ui/`.

## CI

`.github/workflows/ci.yml` runs on pull requests to `main` and pushes to `main`: **lint** (ESLint + Prettier), **typecheck**, **test** (Postgres 17 service container, migrations applied), **e2e** (Playwright, Chromium, production build) and **build**. A newer run cancels a superseded one. Dependabot keeps npm packages and GitHub Actions up to date.
