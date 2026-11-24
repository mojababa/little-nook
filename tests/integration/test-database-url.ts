import { existsSync } from "node:fs";

export function testDatabaseUrl(): string {
  if (!process.env.TEST_DATABASE_URL && existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set (see .env.example)");
  }
  return url;
}
