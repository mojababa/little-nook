import { defineConfig, devices } from "@playwright/test";

import { e2eOutboxDir } from "./e2e/support/outbox-dir";

const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // E2E always runs against a production build, never `next dev`.
  webServer: {
    command: `pnpm build && pnpm start --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      ...(process.env as Record<string, string>),
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "e2e-secret-not-for-production-use",
      // Emails land here as JSON files; e2e/support/mailbox.ts reads them.
      EMAIL_OUTBOX_DIR: e2eOutboxDir,
      RESEND_API_KEY: "",
      // Every test signs up and logs in from the same IP.
      AUTH_DISABLE_RATE_LIMIT: "true",
    },
  },
});
