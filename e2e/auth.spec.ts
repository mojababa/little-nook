import { expect, test, type Page } from "@playwright/test";

import { linkFromEmail, newEmailAddress } from "./support/mailbox";

const password = "chunky-yarn-2026";

async function signUp(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Ana");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByLabel("Currency").selectOption("RSD");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Check your email" }),
  ).toBeVisible();
}

async function verifyEmail(page: Page, email: string) {
  await page.goto(await linkFromEmail(email, "Confirm your email"));
  await expect(page).toHaveURL("/home");
}

async function logIn(page: Page, email: string, withPassword = password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(withPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/home");
}

async function logOut(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/login");
}

test("visitor signs up, verifies their email, then logs out and back in", async ({
  page,
}) => {
  const email = newEmailAddress();
  await signUp(page, email);

  // Not usable until the email is verified.
  await page.goto("/home");
  await expect(page).toHaveURL("/login");

  await verifyEmail(page, email);
  await expect(page.getByText("Hi, Ana!")).toBeVisible();
  await expect(
    page.getByText("You're in Ana's nook. Amounts are in RSD."),
  ).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Main" });
  for (const section of [
    "Inventory",
    "Patterns",
    "Projects",
    "Offers",
    "Finances",
    "Settings",
    "Home",
  ]) {
    await nav.getByRole("link", { name: section }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: section }),
    ).toBeVisible();
  }

  await logOut(page);
  await page.goto("/projects");
  await expect(page).toHaveURL("/login");

  await logIn(page, email);
  await expect(page.getByText("Hi, Ana!")).toBeVisible();
});

test("user resets a forgotten password by email", async ({ page }) => {
  const email = newEmailAddress();
  await signUp(page, email);
  await verifyEmail(page, email);
  await logOut(page);

  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Reset your password" }),
  ).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "a reset link is on its way",
  );

  await page.goto(await linkFromEmail(email, "Reset your"));
  await page.getByLabel("New password").fill("granny-squares-forever");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page).toHaveURL("/login?reset=done");
  await expect(page.getByRole("status")).toContainText(
    "Your password has been changed",
  );

  await logIn(page, email, "granny-squares-forever");
  await expect(page.getByText("Hi, Ana!")).toBeVisible();
});
