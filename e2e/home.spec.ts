import { expect, test } from "@playwright/test";

test("visitor sees the Little Nook placeholder page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Little Nook");
  await expect(
    page.getByRole("heading", { level: 1, name: "Little Nook" }),
  ).toBeVisible();
  await expect(
    page.getByText("Your crochet workshop in one place."),
  ).toBeVisible();
});
