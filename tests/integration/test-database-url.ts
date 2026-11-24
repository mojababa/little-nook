import { existsSync } from "node:fs";

/**
 * The integration-test database URL. The test run wipes this database, so it
 * must be a dedicated one whose name ends in `_test`.
 */
export function testDatabaseUrl(): string {
  if (!process.env.TEST_DATABASE_URL && existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set (see .env.example)");
  }
  const name = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to use database "${name}" for tests: integration tests wipe it, ` +
        "so TEST_DATABASE_URL must name a database ending in _test",
    );
  }
  return url;
}
