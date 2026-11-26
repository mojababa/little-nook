"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getDb } from "@/db";
import { setUpPersonalWorkspace } from "@/server/accounts/workspace-context";
import { requireUser } from "@/server/session";

export type SetUpWorkspaceState = { error: "INVALID_CURRENCY" | null };

/** Creates the logged-in user's workspace in the currency they chose. */
export async function setUpWorkspace(
  _previous: SetUpWorkspaceState,
  form: FormData,
): Promise<SetUpWorkspaceState> {
  const user = await requireUser();
  const t = await getTranslations("Workspace");
  const result = await setUpPersonalWorkspace(getDb(), {
    ownerId: user.id,
    name: t("personalName", { name: user.name }),
    currency: String(form.get("currency")),
  });
  if (!result.ok && result.error === "invalid-currency") {
    return { error: "INVALID_CURRENCY" };
  }
  // Set up now, or already set up (e.g. in another tab): either way, go in.
  redirect("/home");
}
