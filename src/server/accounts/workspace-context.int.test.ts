import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect } from "vitest";

import { workspaceMembers } from "@/db/schema";

import { createTestAuth, test, testDb } from "@tests/integration/fixtures";
import {
  createBrowser,
  fakeGoogleTokenEndpoint,
  googleProfile,
} from "@tests/integration/google";

import {
  setUpPersonalWorkspace,
  workspaceContextForUser,
} from "./workspace-context";
import { getWorkspace } from "./workspaces";

let restoreFetch: () => void;
beforeEach(() => {
  restoreFetch = fakeGoogleTokenEndpoint();
});
afterEach(() => restoreFetch());

/** A user who signed up with Google, so has no workspace yet. */
async function newGoogleUser() {
  const browser = createBrowser(createTestAuth().auth);
  await browser.continueWithGoogle(googleProfile());
  return (await browser.currentUser())!;
}

describe("setUpPersonalWorkspace", () => {
  test("creates the user's workspace in the chosen currency, owned by them", async () => {
    const user = await newGoogleUser();

    const result = await setUpPersonalWorkspace(testDb(), {
      ownerId: user.id,
      name: "Ana's nook",
      currency: "GBP",
    });

    expect(result.ok).toBe(true);
    const ctx = await workspaceContextForUser(testDb(), user.id);
    expect(ctx).toMatchObject({ role: "owner" });
    expect(await getWorkspace(ctx!)).toMatchObject({
      name: "Ana's nook",
      currency: "GBP",
    });
  });

  test("refuses an unsupported currency and creates nothing", async () => {
    const user = await newGoogleUser();

    const result = await setUpPersonalWorkspace(testDb(), {
      ownerId: user.id,
      name: "Ana's nook",
      currency: "XYZ",
    });

    expect(result).toEqual({ ok: false, error: "invalid-currency" });
    expect(await workspaceContextForUser(testDb(), user.id)).toBeUndefined();
  });

  test("never gives a user a second workspace, even when sent twice at once", async () => {
    const user = await newGoogleUser();
    const setUp = (name: string, currency: string) =>
      setUpPersonalWorkspace(testDb(), { ownerId: user.id, name, currency });

    const results = await Promise.all([
      setUp("First nook", "EUR"),
      setUp("Second nook", "USD"),
    ]);
    const again = await setUp("Third nook", "GBP");

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([
      { ok: false, error: "already-set-up" },
    ]);
    expect(again).toEqual({ ok: false, error: "already-set-up" });
    const memberships = await testDb()
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id));
    expect(memberships).toHaveLength(1);
  });
});
