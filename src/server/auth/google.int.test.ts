import { afterEach, beforeEach, describe, expect } from "vitest";

import { workspaceContextForUser } from "@/server/accounts/workspace-context";
import {
  createTestAuth,
  signUp,
  signUpVerified,
  test,
  testDb,
  uniqueEmail,
} from "@tests/integration/fixtures";
import {
  type Browser,
  createBrowser,
  fakeGoogleTokenEndpoint,
  googleProfile,
} from "@tests/integration/google";

const password = "correct horse battery";

let restoreFetch: () => void;
beforeEach(() => {
  restoreFetch = fakeGoogleTokenEndpoint();
});
afterEach(() => restoreFetch());

describe("continuing with Google for the first time", () => {
  test("creates a logged-in account and sends the user to choose a currency", async () => {
    const { auth } = createTestAuth();
    const browser = createBrowser(auth);
    const profile = googleProfile({ name: "Ana" });

    const landing = await browser.continueWithGoogle(profile);

    expect(landing.pathname).toBe("/welcome");
    const user = await browser.currentUser();
    expect(user).toMatchObject({ email: profile.email, emailVerified: true });
    expect(await workspaceContextForUser(testDb(), user!.id)).toBeUndefined();
  });

  test("emails a verification link instead of logging in when Google hasn't verified the email", async () => {
    const { auth, outbox } = createTestAuth();
    const browser = createBrowser(auth);
    const profile = googleProfile({ email_verified: false });

    const landing = await browser.continueWithGoogle(profile);

    expect(landing.pathname).toBe("/login");
    expect(landing.searchParams.get("error")).toBe("email_not_verified");
    expect(await browser.currentUser()).toBeNull();
    expect(outbox.map((sent) => sent.to)).toEqual([profile.email]);
  });
});

describe("continuing with Google again", () => {
  test("logs in to the same account, even after the Google email changed", async () => {
    const { auth } = createTestAuth();
    const profile = googleProfile();
    await createBrowser(auth).continueWithGoogle(profile);
    const first = await createBrowser(auth).continueWithGoogle(profile);
    const browser = createBrowser(auth);

    const landing = await browser.continueWithGoogle({
      ...profile,
      email: uniqueEmail(),
    });

    expect(first.pathname).toBe("/home");
    expect(landing.pathname).toBe("/home");
    expect(await browser.currentUser()).toMatchObject({ email: profile.email });
  });
});

describe("continuing with Google when an account has the same email", () => {
  test("links Google to that account when both emails are verified", async () => {
    const testAuth = createTestAuth();
    const email = uniqueEmail();
    const existing = await signUpVerified(testAuth, {
      name: "Ana",
      email,
      password,
    });
    const browser = createBrowser(testAuth.auth);

    const landing = await browser.continueWithGoogle(googleProfile({ email }));

    expect(landing.pathname).toBe("/home");
    expect(await browser.currentUser()).toMatchObject({ id: existing.id });
    expect(await providersOf(browser)).toEqual(["credential", "google"]);
    // The password still works too.
    await createBrowser(testAuth.auth).logIn(email, password);
  });

  test("doesn't link, or create a second account, when Google hasn't verified the email", async () => {
    const testAuth = createTestAuth();
    const email = uniqueEmail();
    await signUpVerified(testAuth, { name: "Ana", email, password });
    const browser = createBrowser(testAuth.auth);

    const landing = await browser.continueWithGoogle(
      googleProfile({ email, email_verified: false }),
    );

    expect(landing.pathname).toBe("/login");
    expect(landing.searchParams.get("error")).toBe("account_not_linked");
    expect(await browser.currentUser()).toBeNull();
    const owner = createBrowser(testAuth.auth);
    await owner.logIn(email, password);
    expect(await providersOf(owner)).toEqual(["credential"]);
  });

  test("doesn't link to an account whose email was never verified", async () => {
    // Otherwise someone could sign up with another person's address and set a
    // password, and later get into the account that person reaches with Google.
    const { auth } = createTestAuth();
    const email = uniqueEmail();
    await signUp(auth, { name: "Mallory", email, password, currency: "EUR" });
    const browser = createBrowser(auth);

    const landing = await browser.continueWithGoogle(googleProfile({ email }));

    expect(landing.searchParams.get("error")).toBe("account_not_linked");
    expect(await browser.currentUser()).toBeNull();
  });
});

describe("linking Google from settings", () => {
  test("adds Google as a way to log in, even with a different email", async () => {
    const testAuth = createTestAuth();
    const email = uniqueEmail();
    const user = await signUpVerified(testAuth, {
      name: "Ana",
      email,
      password,
    });
    const browser = createBrowser(testAuth.auth);
    await browser.logIn(email, password);
    const google = googleProfile({ email: uniqueEmail() });

    const landing = await browser.linkGoogle(google);

    expect(landing.pathname).toBe("/settings");
    expect(landing.searchParams.get("error")).toBeNull();
    expect(await providersOf(browser)).toEqual(["credential", "google"]);
    const viaGoogle = createBrowser(testAuth.auth);
    await viaGoogle.continueWithGoogle(google);
    expect(await viaGoogle.currentUser()).toMatchObject({ id: user.id, email });
  });

  test("refuses a Google account that already belongs to another user", async () => {
    const testAuth = createTestAuth();
    const google = googleProfile();
    await createBrowser(testAuth.auth).continueWithGoogle(google);
    const email = uniqueEmail();
    await signUpVerified(testAuth, { name: "Ben", email, password });
    const browser = createBrowser(testAuth.auth);
    await browser.logIn(email, password);

    const landing = await browser.linkGoogle(google);

    expect(landing.pathname).toBe("/settings");
    expect(landing.searchParams.get("error")).toBe(
      "account_already_linked_to_different_user",
    );
    expect(await providersOf(browser)).toEqual(["credential"]);
  });
});

describe("unlinking Google", () => {
  test("removes Google when the account also has a password", async () => {
    const testAuth = createTestAuth();
    const email = uniqueEmail();
    await signUpVerified(testAuth, { name: "Ana", email, password });
    const browser = createBrowser(testAuth.auth);
    await browser.logIn(email, password);
    const google = googleProfile({ email });
    await browser.linkGoogle(google);

    const response = await browser.post("/api/auth/unlink-account", {
      accountId: await accountIdOf(browser, "google"),
    });

    expect(response.status).toBe(200);
    expect(await providersOf(browser)).toEqual(["credential"]);
  });

  test("refuses to remove the only way to log in", async () => {
    const { auth } = createTestAuth();
    const browser = createBrowser(auth);
    await browser.continueWithGoogle(googleProfile());

    const response = await browser.post("/api/auth/unlink-account", {
      accountId: await accountIdOf(browser, "google"),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "FAILED_TO_UNLINK_LAST_ACCOUNT",
    });
    expect(await providersOf(browser)).toEqual(["google"]);
  });
});

async function accountIdOf(browser: Browser, providerId: string) {
  const methods = await browser.signInMethods();
  return methods.find((m) => m.providerId === providerId)!.id;
}

async function providersOf(browser: Browser) {
  return (await browser.signInMethods()).map((m) => m.providerId).sort();
}
