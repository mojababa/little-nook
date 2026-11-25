import { requireUser } from "@/server/session";

/**
 * Renders `children` only for a logged-in user, else redirects to /login.
 * It reads the request, so it must sit inside `<Suspense>`.
 */
export async function SessionGate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
