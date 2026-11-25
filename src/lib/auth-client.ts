import { createAuthClient } from "better-auth/react";

/** Calls the auth endpoints (src/app/api/auth) from the browser. */
export const authClient = createAuthClient();

type SignUpInput = Parameters<typeof authClient.signUp.email>[0];

/**
 * Signs up with email and password. `currency` becomes the personal
 * workspace's currency (see src/server/auth/auth.ts); Better Auth's types
 * don't know about it, but its sign-up endpoint passes extra fields through.
 */
export function signUpWithEmail(input: SignUpInput & { currency: string }) {
  return authClient.signUp.email(input);
}
