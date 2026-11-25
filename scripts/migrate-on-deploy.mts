// Applies pending migrations during a Vercel build, before `next build`
// (see `buildCommand` in vercel.json).
//
// - Production deployments always migrate, and fail the build if
//   DATABASE_URL is missing: deploying code ahead of its schema is worse than
//   not deploying.
// - Preview deployments migrate only with MIGRATE_PREVIEWS=true. Turn that on
//   only when every preview has its own database (e.g. a Neon branch per
//   preview); otherwise a pull request's unmerged migrations would be applied
//   to whatever database previews share, possibly production's.
//
// Migrations run before the new code is live, so the previous deployment keeps
// serving against the migrated schema until the build finishes: keep
// migrations backwards compatible (add, don't drop or rename, in one step).

import { spawnSync } from "node:child_process";

const target = process.env.VERCEL_ENV;
const shouldMigrate =
  target === "production" ||
  (target === "preview" && process.env.MIGRATE_PREVIEWS === "true");

if (!shouldMigrate) {
  console.log(
    `[migrate-on-deploy] Skipping migrations for VERCEL_ENV=${target ?? "(unset)"}.`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    `[migrate-on-deploy] DATABASE_URL is not set for this ${target} deployment.`,
  );
  process.exit(1);
}

console.log(`[migrate-on-deploy] Applying migrations (${target}).`);
const result = spawnSync("pnpm", ["db:migrate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
