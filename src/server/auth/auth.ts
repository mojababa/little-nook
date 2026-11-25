import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { createTranslator } from "next-intl";

import type { Db } from "@/db/client";
import * as schema from "@/db/schema";
import { defaultLocale } from "@/i18n/config";
import { isCurrency } from "@/lib/currencies";
import { createPersonalWorkspace } from "@/server/accounts/workspace-context";
import type { Mailer } from "@/server/email/mailer";

import messages from "../../../messages/en.json";

export type AuthDeps = {
  db: Db;
  mailer: Mailer;
  /** The app's public origin, e.g. https://littlenook.app. */
  baseURL: string;
  secret: string;
  /**
   * Turns off Better Auth's per-IP rate limiting (on in production by default).
   * Only for E2E runs, where every test shares one IP.
   */
  disableRateLimit?: boolean;
};

/**
 * Better Auth configured for Little Nook: email + password with required email
 * verification and password reset by email. Signing up also creates the
 * user's personal workspace in the currency they chose (`currency` in the
 * sign-up body).
 *
 * The app's instance comes from `getAuth()` (`@/server/auth`); tests build one
 * on the test database.
 */
export function createAuth({
  db,
  mailer,
  baseURL,
  secret,
  disableRateLimit,
}: AuthDeps) {
  // Emails go out in the default locale until users have a language preference.
  const t = createTranslator({
    locale: defaultLocale,
    messages,
    namespace: "Emails",
  });

  return betterAuth({
    appName: "Little Nook",
    baseURL,
    secret,
    database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
    advanced: { database: { generateId: "uuid" } },
    telemetry: { enabled: false },
    ...(disableRateLimit && { rateLimit: { enabled: false } }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      async sendResetPassword({ user, url }) {
        await mailer.send({
          to: user.email,
          subject: t("resetPassword.subject"),
          text: t("resetPassword.body", { name: user.name, url }),
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      // Logging in unverified sends a fresh link, e.g. when the first expired.
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      async sendVerificationEmail({ user, url }) {
        await mailer.send({
          to: user.email,
          subject: t("verifyEmail.subject"),
          text: t("verifyEmail.body", { name: user.name, url }),
        });
      },
    },
    databaseHooks: {
      user: {
        create: {
          async before(_user, ctx) {
            if (!isCurrency(ctx?.body?.currency)) {
              throw APIError.from("BAD_REQUEST", {
                code: "INVALID_CURRENCY",
                message: "Choose a supported currency",
              });
            }
          },
          async after(user, ctx) {
            try {
              await createPersonalWorkspace(db, {
                ownerId: user.id,
                name: t("workspaceName", { name: user.name }),
                currency: ctx!.body.currency,
              });
            } catch (error) {
              // Without a workspace the account is unusable: remove it so
              // signing up again with the same address works.
              await db.delete(schema.users).where(eq(schema.users.id, user.id));
              throw error;
            }
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
