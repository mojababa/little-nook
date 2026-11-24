import type { Db } from "@/db/client";

/**
 * Passed as the first argument to every domain service function.
 * Adapters derive it from the session; tests build it with the workspace fixture.
 * Every query a service runs is scoped by `workspaceId`.
 */
export type WorkspaceContext = {
  db: Db;
  workspaceId: string;
};
