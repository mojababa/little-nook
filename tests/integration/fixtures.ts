import { randomUUID } from "node:crypto";

import { inArray, like } from "drizzle-orm";
import { afterAll, test as base } from "vitest";

import { createDb, type Db } from "@/db/client";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import type { WorkspaceContext } from "@/server/context";
import { createAuth } from "@/server/auth/auth";
import type { Email } from "@/server/email/mailer";

import { testDatabaseUrl } from "./test-database-url";

let db: Db | undefined;
const createdWorkspaceIds: string[] = [];
// Test files run in parallel against one database, so each file only cleans up
// the users it signed up: their emails carry this file's tag.
const emailDomain = `${randomUUID()}.test`;

export function testDb(): Db {
  db ??= createDb(testDatabaseUrl());
  return db;
}

afterAll(async () => {
  if (!db) return;
  const signedUp = db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, `%@${emailDomain}`));
  const theirWorkspaces = db
    .select({ id: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(inArray(workspaceMembers.userId, signedUp));
  await db.delete(workspaces).where(inArray(workspaces.id, theirWorkspaces));
  await db.delete(users).where(like(users.email, `%@${emailDomain}`));
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
    .values({ name: "Test workspace", currency: "EUR", ...overrides })
    .returning({ id: workspaces.id });
  createdWorkspaceIds.push(workspace.id);
  return { db: testDb(), workspaceId: workspace.id };
}

/** A unique email address; its user is deleted when the test file finishes. */
export function uniqueEmail(): string {
  return `maker-${randomUUID().slice(0, 8)}@${emailDomain}`;
}

export const testBaseUrl = "http://localhost:3000";

/**
 * An auth instance on the test database. Emails it sends land in `outbox`
 * instead of being delivered.
 */
export function createTestAuth() {
  const outbox: Email[] = [];
  const auth = createAuth({
    db: testDb(),
    baseURL: testBaseUrl,
    secret: "integration-test-secret-not-for-production",
    // Google's token endpoint is faked in tests: see ./google.ts.
    google: { clientId: "test-google-client", clientSecret: "test-secret" },
    mailer: {
      async send(email) {
        outbox.push(email);
      },
    },
  });
  return { auth, outbox };
}

type TestAuth = ReturnType<typeof createTestAuth>["auth"];

/**
 * Signs up through the auth API. `currency` is passed through to the sign-up
 * hook, though Better Auth's body type doesn't declare it.
 */
export function signUp(
  auth: TestAuth,
  body: { name: string; email: string; password: string; currency?: string },
) {
  return auth.api.signUpEmail({ body });
}

/**
 * Signs up with email and password and follows the emailed verification
 * link, so the account can log in.
 */
export async function signUpVerified(
  { auth, outbox }: ReturnType<typeof createTestAuth>,
  body: { name: string; email: string; password: string; currency?: string },
) {
  const { user } = await signUp(auth, { currency: "EUR", ...body });
  const verification = outbox.findLast((sent) => sent.to === body.email);
  const link = verification?.text.match(/https?:\/\/\S+/)?.[0];
  if (!link) throw new Error(`No verification link for ${body.email}`);
  const response = await auth.handler(new Request(link));
  if (response.status !== 302) throw new Error("Verification failed");
  return user;
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
