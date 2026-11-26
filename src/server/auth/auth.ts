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
  /** Google OAuth client; without it, "Continue with Google" is off. */
  google?: { clientId: string; clientSecret: string };
};

const emailSignUpPath = "/sign-up/email";

/**
 * Better Auth configured for Little Nook: email + password with required email
 * verification and password reset by email, and "Continue with Google" when a
 * Google client is configured. Signing up with email also creates the user's
 * personal workspace in the currency they chose (`currency` in the sign-up
 * body); Google sign-ups choose it on first login (/welcome).
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
  google,
}: AuthDeps) {
  // Emails and the workspace name are in the default locale until users have
  // a language preference.
  const t = createTranslator({
    locale: defaultLocale,
    messages,
    namespace: "Emails",
  });
  const tWorkspace = createTranslator({
    locale: defaultLocale,
    messages,
    namespace: "Workspace",
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
    account: {
      // Continuing with Google links to an existing account with the same
      // email only when both Google and the account have verified it (so
      // nobody can pre-register someone else's address); otherwise the
      // callback fails with `account_not_linked` and no account is created.
      // These are Better Auth's defaults, spelled out because they are rules.
      accountLinking: {
        enabled: true,
        trustedProviders: [],
        requireLocalEmailVerified: true,
        // Linking from settings happens while logged in, so the Google
        // account may use another address.
        allowDifferentEmails: true,
        // Unlinking the only way to log in is refused.
        allowUnlinkingAll: false,
      },
    },
    ...(google && {
      socialProviders: {
        google: {
          ...google,
          prompt: "select_account",
          // Google accounts almost always have a verified email; one that
          // doesn't gets a verification email instead of a session.
          requireEmailVerification: true,
        },
      },
    }),
    databaseHooks: {
      user: {
        create: {
          async before(_user, ctx) {
            if (ctx?.path !== emailSignUpPath) return;
            if (!isCurrency(ctx.body?.currency)) {
              throw APIError.from("BAD_REQUEST", {
                code: "INVALID_CURRENCY",
                message: "Choose a supported currency",
              });
            }
          },
          async after(user, ctx) {
            // Google sign-ups choose their currency on first login (/welcome).
            if (ctx?.path !== emailSignUpPath) return;
            try {
              await createPersonalWorkspace(db, {
                ownerId: user.id,
                name: tWorkspace("personalName", { name: user.name }),
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
