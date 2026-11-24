import { expect, test } from "@playwright/test";

test("browser reports Little Nook as installable", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toBeTruthy();
  const manifest = await (await request.get(manifestHref!)).json();
  expect(manifest).toMatchObject({
    name: "Little Nook",
    start_url: "/",
    display: "standalone",
  });

  const themeColor = await page
    .locator('meta[name="theme-color"]')
    .getAttribute("content");
  expect(themeColor).toBe(manifest.theme_color);

  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok(), icon.src).toBe(true);
    expect(response.headers()["content-type"]).toBe(icon.type);
  }

  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send(
    "Page.getInstallabilityErrors",
  );
  expect(installabilityErrors).toEqual([]);
});

test("app shell is served by the service worker when offline", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);

  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: "You're offline" }),
  ).toBeVisible();

  await context.setOffline(false);
  await page.getByRole("link", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
  ).toBeVisible();
  await expect(page).toHaveURL("/privacy");
});
