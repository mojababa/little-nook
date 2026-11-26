import { requireWorkspaceContext } from "@/server/session";

/**
 * Renders `children` only for a logged-in user with a workspace, else
 * redirects to /login (or /welcome to set the workspace up). It reads the
 * request, so it must sit inside `<Suspense>`.
 */
export async function SessionGate({ children }: { children: React.ReactNode }) {
  await requireWorkspaceContext();
  return children;
}
