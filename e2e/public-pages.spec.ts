import { expect, test } from "@playwright/test";

test("visitor reads about Little Nook and finds the sign-up and log-in links", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Little Nook");
  await expect(
    page.getByRole("heading", { level: 1, name: "Little Nook" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Inventory", level: 3 }),
  ).toBeVisible();

  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Sign up" })).toHaveAttribute(
    "href",
    "/signup",
  );
  await expect(main.getByRole("link", { name: "Log in" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("visitor goes from the landing page to the Privacy Policy and Terms of Service", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");

  await footer.getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL("/privacy");
  await expect(page).toHaveTitle("Privacy Policy · Little Nook");
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
  ).toBeVisible();

  await page
    .getByRole("banner")
    .getByRole("link", { name: "Little Nook" })
    .click();
  await expect(page).toHaveURL("/");

  await footer.getByRole("link", { name: "Terms of Service" }).click();
  await expect(page).toHaveURL("/terms");
  await expect(page).toHaveTitle("Terms of Service · Little Nook");
  await expect(
    page.getByRole("heading", { level: 1, name: "Terms of Service" }),
  ).toBeVisible();
});
