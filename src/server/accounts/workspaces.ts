import { eq } from "drizzle-orm";

import { workspaces } from "@/db/schema";
import type { WorkspaceContext } from "@/server/context";
import { err, ok, type Result } from "@/server/result";

export async function getWorkspace(ctx: WorkspaceContext) {
  const [workspace] = await ctx.db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      currency: workspaces.currency,
      plan: workspaces.plan,
    })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId));
  return workspace;
}

export async function renameWorkspace(
  ctx: WorkspaceContext,
  input: { name: string },
): Promise<Result<undefined, "name-required">> {
  const name = input.name.trim();
  if (!name) return err("name-required");

  await ctx.db
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, ctx.workspaceId));
  return ok();
}
