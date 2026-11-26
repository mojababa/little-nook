"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

import { FormError, useAuthSubmit } from "./form-parts";

/**
 * "Continue with Google" for the sign-up and log-in pages. A new Google user
 * lands on /welcome to choose a currency; if Google sign-in fails, Google
 * sends the browser back to `returnTo` with `?error=<code>` (see
 * `GoogleErrorNotice`).
 */
function ContinueWithGoogle({ returnTo }: { returnTo: "/login" | "/signup" }) {
  const t = useTranslations("Auth");
  const { error, pending, submit } = useAuthSubmit();

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-10"
        disabled={pending}
        onClick={() =>
          submit(
            () =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: "/home",
                newUserCallbackURL: "/welcome",
                errorCallbackURL: returnTo,
              }),
            // The auth client takes the browser to Google.
            () => {},
          )
        }
      >
        <GoogleLogo />
        {t("continueWithGoogle")}
      </Button>
      <FormError code={error} />
    </div>
  );
}

/**
 * The Google option above the email form on the sign-up and log-in pages:
 * why the last attempt failed, if it did, the button, and "or".
 */
export function GoogleSignInOption({
  returnTo,
}: {
  returnTo: "/login" | "/signup";
}) {
  return (
    <>
      <Suspense>
        <GoogleErrorNotice />
      </Suspense>
      <ContinueWithGoogle returnTo={returnTo} />
      <OrDivider />
    </>
  );
}

/** "or", between "Continue with Google" and the email form. */
function OrDivider() {
  const t = useTranslations("Auth");
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {t("or")}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

const googleErrors = [
  "account_not_linked",
  "email_not_verified",
  "account_already_linked_to_different_user",
] as const;

/**
 * Explains a failed Google sign-in or link, from the `?error=` Better Auth
 * redirects back with. Reads the URL, so it must sit inside `<Suspense>`.
 */
export function GoogleErrorNotice() {
  const t = useTranslations("Auth.googleErrors");
  const code = useSearchParams().get("error");
  if (!code) return null;
  const known = googleErrors.find((error) => error === code);
  return (
    <p role="alert" className="rounded-lg border p-3 text-sm text-destructive">
      {t(known ?? "default")}
    </p>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}
