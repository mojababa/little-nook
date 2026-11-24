import "server-only";

import { createDb, type Db } from "./client";

let db: Db | undefined;

/** The app's shared database handle. Only adapters (server actions, route handlers) call this. */
export function getDb(): Db {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    db = createDb(url);
  }
  return db;
}
