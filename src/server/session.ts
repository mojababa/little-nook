import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/db";
import {
  workspaceContextForUser,
  type MemberContext,
} from "@/server/accounts/workspace-context";
import { getAuth } from "@/server/auth";

// The session helpers adapters (pages, server actions, route handlers) use.
// Each one re-checks the session itself: never rely on a layout or the proxy
// having checked it, because layouts don't re-render on every navigation.

const getSession = cache(async () => {
  // Read the request first: that is where prerendering stops.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
});

/** The logged-in user. Redirects to /login when there is none. */
export async function requireUser() {
  const session = await getSession();
  // Sessions are only created for verified users; the check is belt and braces.
  if (!session?.user.emailVerified) redirect("/login");
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}

/**
 * The workspace context for the logged-in user, passed to every service
 * function. Redirects to /login when no one is logged in, and to /welcome
 * when the user hasn't set up their workspace yet (Google sign-ups).
 */
export const requireWorkspaceContext = cache(
  async (): Promise<MemberContext> => {
    const user = await requireUser();
    const ctx = await workspaceContextForUser(getDb(), user.id);
    if (!ctx) redirect("/welcome");
    return ctx;
  },
);

/** How the logged-in user can log in. Redirects to /login when no one is. */
export async function requireSignInMethods() {
  await requireUser();
  const accounts = await getAuth().api.listUserAccounts({
    headers: await headers(),
  });
  return {
    hasPassword: accounts.some(
      (account) => account.providerId === "credential",
    ),
    /** The id to unlink Google with, when it is linked. */
    googleAccountId:
      accounts.find((account) => account.providerId === "google")?.id ?? null,
  };
}
