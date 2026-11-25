import { asc, eq } from "drizzle-orm";

import type { Db } from "@/db/client";
import { workspaceMembers, workspaces } from "@/db/schema";
import type { Currency } from "@/lib/currencies";
import type { WorkspaceContext } from "@/server/context";

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

/** Creates a workspace with `ownerId` as its owner. */
export async function createPersonalWorkspace(
  db: Db,
  input: { ownerId: string; name: string; currency: Currency },
): Promise<MemberContext> {
  return db.transaction(async (tx) => {
    const [workspace] = await tx
      .insert(workspaces)
      .values({ name: input.name, currency: input.currency })
      .returning({ id: workspaces.id });
    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: input.ownerId,
      role: "owner",
    });
    return { db, workspaceId: workspace.id, role: "owner" };
  });
}
