import "server-only";

import { getDb } from "@/db";
import { mailerFromEnv } from "@/server/email/mailer";

import { createAuth, type Auth } from "./auth";

let auth: Auth | undefined;

/** The app's auth instance, configured from the environment. */
export function getAuth(): Auth {
  if (!auth) {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
    auth = createAuth({
      db: getDb(),
      mailer: mailerFromEnv(),
      baseURL: appBaseUrl(),
      secret,
      disableRateLimit: process.env.AUTH_DISABLE_RATE_LIMIT === "true",
    });
  }
  return auth;
}

function appBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  // Vercel preview deployments get a URL per deployment.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
