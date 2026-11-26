import { asc, eq } from "drizzle-orm";

import type { Db } from "@/db/client";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { isCurrency, type Currency } from "@/lib/currencies";
import type { WorkspaceContext } from "@/server/context";
import { err, ok, type Result } from "@/server/result";

export type WorkspaceRole = (typeof workspaceMembers.$inferSelect)["role"];

export type MemberContext = WorkspaceContext & { role: WorkspaceRole };

/**
 * The context service functions receive on behalf of `userId`: their
 * workspace, found through their membership. Adapters derive `userId` from the
 * session, so a user can only ever act in a workspace they belong to.
 * Undefined when the user belongs to no workspace.
 */
export async function workspaceContextForUser(
  db: Db,
  userId: string,
): Promise<MemberContext | undefined> {
  // Every user has exactly one (personal) workspace until invites exist.
  const [membership] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaceMembers.createdAt))
    .limit(1);
  return membership && { db, ...membership };
}

/**
 * The first-login step for users who signed up without choosing a currency
 * (Google sign-ups): creates their personal workspace. Refused when they
 * already have one, so a form sent twice doesn't create a second.
 */
export async function setUpPersonalWorkspace(
  db: Db,
  input: { ownerId: string; name: string; currency: string },
): Promise<Result<MemberContext, "invalid-currency" | "already-set-up">> {
  const { currency } = input;
  if (!isCurrency(currency)) return err("invalid-currency");

  return db.transaction(async (tx) => {
    // Locking the user's row makes concurrent set-ups for them take turns.
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.ownerId))
      .for("update");
    const [membership] = await tx
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, input.ownerId))
      .limit(1);
    if (membership) return err("already-set-up");

    const workspaceId = await insertPersonalWorkspace(tx, {
      ...input,
      currency,
    });
    return ok({ db, workspaceId, role: "owner" as const });
  });
}

/** Creates a workspace with `ownerId` as its owner. */
export async function createPersonalWorkspace(
  db: Db,
  input: { ownerId: string; name: string; currency: Currency },
): Promise<MemberContext> {
  const workspaceId = await db.transaction((tx) =>
    insertPersonalWorkspace(tx, input),
  );
  return { db, workspaceId, role: "owner" };
}

type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function insertPersonalWorkspace(
  tx: Transaction,
  input: { ownerId: string; name: string; currency: Currency },
): Promise<string> {
  const [workspace] = await tx
    .insert(workspaces)
    .values({ name: input.name, currency: input.currency })
    .returning({ id: workspaces.id });
  await tx.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: input.ownerId,
    role: "owner",
  });
  return workspace.id;
}
