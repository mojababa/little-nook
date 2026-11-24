import { inArray } from "drizzle-orm";
import { afterAll, test as base } from "vitest";

import { createDb, type Db } from "@/db/client";
import { workspaces } from "@/db/schema";
import type { WorkspaceContext } from "@/server/context";

import { testDatabaseUrl } from "./test-database-url";

let db: Db | undefined;
const createdWorkspaceIds: string[] = [];

function testDb(): Db {
  db ??= createDb(testDatabaseUrl());
  return db;
}

afterAll(async () => {
  if (!db) return;
  if (createdWorkspaceIds.length) {
    await db
      .delete(workspaces)
      .where(inArray(workspaces.id, createdWorkspaceIds.splice(0)));
  }
  await db.$client.end();
  db = undefined;
});

/**
 * Creates a fresh workspace and returns the context a service function receives
 * for it. Workspaces are deleted when the test file finishes.
 */
export async function createWorkspace(
  overrides: Partial<typeof workspaces.$inferInsert> = {},
): Promise<WorkspaceContext> {
  const [workspace] = await testDb()
    .insert(workspaces)
    .values({ name: "Test workspace", ...overrides })
    .returning({ id: workspaces.id });
  createdWorkspaceIds.push(workspace.id);
  return { db: testDb(), workspaceId: workspace.id };
}

/**
 * Integration `test` with a `ctx` fixture: every test gets its own workspace,
 * so tests are isolated from each other without resetting the database.
 */
export const test = base.extend<{ ctx: WorkspaceContext }>({
  ctx: async ({}, provide) => {
    await provide(await createWorkspace());
  },
});
