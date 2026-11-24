import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { createDb } from "@/db/client";

import { testDatabaseUrl } from "./test-database-url";

/** Runs once per `vitest` run: rebuilds the test database from the committed migrations. */
export default async function setup() {
  const db = createDb(testDatabaseUrl());
  try {
    await db.execute(sql`set client_min_messages = warning`);
    await db.execute(sql`drop schema if exists public cascade`);
    await db.execute(sql`drop schema if exists drizzle cascade`);
    await db.execute(sql`create schema public`);
    await migrate(db, { migrationsFolder: "drizzle" });
  } finally {
    await db.$client.end();
  }
}
