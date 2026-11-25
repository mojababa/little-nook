"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

import { Field, FormError, useAuthSubmit } from "./form-parts";

export function LoginForm() {
  const t = useTranslations("LoginPage");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const { error, pending, submit } = useAuthSubmit();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    return submit(
      () =>
        authClient.signIn.email({
          email: String(form.get("email")),
          password: String(form.get("password")),
          // Where the fresh verification link leads if the email isn't verified yet.
          callbackURL: "/home",
        }),
      () => router.replace("/home"),
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field
        label={tAuth("email")}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Field
        label={tAuth("password")}
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <FormError code={error} />
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

/** Shown after a password reset sends the user here with `?reset=done`. */
export function PasswordResetNotice() {
  const t = useTranslations("LoginPage");
  const searchParams = useSearchParams();
  if (searchParams.get("reset") !== "done") return null;
  return (
    <p role="status" className="rounded-lg border p-3 text-sm">
      {t("passwordReset")}
    </p>
  );
}
