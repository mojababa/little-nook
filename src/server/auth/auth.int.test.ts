import { describe, expect } from "vitest";

import { getWorkspace } from "@/server/accounts/workspaces";
import { workspaceContextForUser } from "@/server/accounts/workspace-context";
import {
  createTestAuth,
  signUp,
  test,
  testDb,
  uniqueEmail,
} from "@tests/integration/fixtures";

const password = "correct horse battery";

function linkIn(text: string): string {
  const link = text.match(/https?:\/\/\S+/)?.[0];
  if (!link) throw new Error(`No link in email:\n${text}`);
  return link;
}

describe("signing up", () => {
  test("creates a personal workspace in the chosen currency, owned by the new user", async () => {
    const { auth } = createTestAuth();

    const { user } = await signUp(auth, {
      name: "Ana",
      email: uniqueEmail(),
      password,
      currency: "RSD",
    });

    const ctx = await workspaceContextForUser(testDb(), user.id);
    expect(ctx).toMatchObject({ role: "owner" });
    expect(await getWorkspace(ctx!)).toMatchObject({
      name: "Ana's nook",
      currency: "RSD",
      plan: "free",
    });
  });

  test("refuses a missing or unsupported currency, without creating the account", async () => {
    const { auth, outbox } = createTestAuth();
    const email = uniqueEmail();

    await expect(
      signUp(auth, { name: "Ana", email, password, currency: "XYZ" }),
    ).rejects.toMatchObject({ body: { code: "INVALID_CURRENCY" } });
    await expect(
      signUp(auth, { name: "Ana", email, password }),
    ).rejects.toMatchObject({ body: { code: "INVALID_CURRENCY" } });
    expect(outbox).toEqual([]);

    // The address is still free.
    const { user } = await signUp(auth, {
      name: "Ana",
      email,
      password,
      currency: "EUR",
    });
    expect(await workspaceContextForUser(testDb(), user.id)).toBeDefined();
  });

  test("requires the emailed verification link before the user can log in", async () => {
    const { auth, outbox } = createTestAuth();
    const email = uniqueEmail();
    await signUp(auth, { name: "Ana", email, password, currency: "EUR" });

    await expect(
      auth.api.signInEmail({ body: { email, password } }),
    ).rejects.toMatchObject({ body: { code: "EMAIL_NOT_VERIFIED" } });

    const verification = outbox.find((sent) => sent.to === email);
    expect(verification).toBeDefined();
    const response = await auth.handler(
      new Request(linkIn(verification!.text)),
    );
    expect(response.status).toBe(302);

    const signedIn = await auth.api.signInEmail({ body: { email, password } });
    expect(signedIn.user.emailVerified).toBe(true);
  });
});

describe("workspaceContextForUser", () => {
  test("gives each user their own workspace and never another's", async () => {
    const { auth } = createTestAuth();
    const signUpAs = async (name: string, currency: string) =>
      (await signUp(auth, { name, email: uniqueEmail(), password, currency }))
        .user;
    const ana = await signUpAs("Ana", "EUR");
    const ben = await signUpAs("Ben", "GBP");

    const anaCtx = await workspaceContextForUser(testDb(), ana.id);
    const benCtx = await workspaceContextForUser(testDb(), ben.id);

    expect(anaCtx!.workspaceId).not.toBe(benCtx!.workspaceId);
    expect(await getWorkspace(anaCtx!)).toMatchObject({ name: "Ana's nook" });
    expect(await getWorkspace(benCtx!)).toMatchObject({ name: "Ben's nook" });
  });

  test("gives no workspace to a user who isn't a member of one", async () => {
    expect(
      await workspaceContextForUser(
        testDb(),
        "00000000-0000-4000-8000-000000000000",
      ),
    ).toBeUndefined();
  });
});
