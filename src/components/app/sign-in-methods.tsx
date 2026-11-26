"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { FormError, useAuthSubmit } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * The ways the user can log in, with Google linked or unlinked from here.
 * Better Auth refuses to unlink the only one; the button says so up front.
 */
export function SignInMethods({
  hasPassword,
  googleAccountId,
  googleAvailable,
}: {
  hasPassword: boolean;
  /** Set when Google is linked. */
  googleAccountId: string | null;
  /** Whether "Continue with Google" is configured on this deployment. */
  googleAvailable: boolean;
}) {
  const t = useTranslations("AppPages.settings.signInMethods");
  const router = useRouter();
  const link = useAuthSubmit();
  const unlink = useAuthSubmit();
  const onlyMethod = !hasPassword;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
      <ul className="flex flex-col divide-y rounded-lg border">
        {hasPassword && (
          <li className="flex items-center justify-between gap-4 p-4">
            <span>{t("password")}</span>
            <span className="text-sm text-muted-foreground">{t("linked")}</span>
          </li>
        )}
        {(googleAccountId || googleAvailable) && (
          <li className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span>{t("google")}</span>
                <span className="text-sm text-muted-foreground">
                  {googleAccountId ? t("linked") : t("notLinked")}
                </span>
              </div>
              {googleAccountId ? (
                <Button
                  variant="outline"
                  disabled={onlyMethod || unlink.pending}
                  aria-describedby={onlyMethod ? "google-only" : undefined}
                  onClick={() =>
                    unlink.submit(
                      () =>
                        authClient.unlinkAccount({
                          accountId: googleAccountId,
                        }),
                      () => router.refresh(),
                    )
                  }
                >
                  {unlink.pending ? t("unlinking") : t("unlink")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={link.pending}
                  onClick={() =>
                    link.submit(
                      () =>
                        authClient.linkSocial({
                          provider: "google",
                          callbackURL: "/settings",
                          errorCallbackURL: "/settings",
                        }),
                      // The auth client takes the browser to Google.
                      () => {},
                    )
                  }
                >
                  {link.pending ? t("linking") : t("link")}
                </Button>
              )}
            </div>
            {googleAccountId && onlyMethod && (
              <p id="google-only" className="text-xs text-muted-foreground">
                {t("onlyMethod")}
              </p>
            )}
            <FormError code={link.error ?? unlink.error} />
          </li>
        )}
      </ul>
    </section>
  );
}
