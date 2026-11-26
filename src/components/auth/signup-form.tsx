"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { signUpWithEmail } from "@/lib/auth-client";

import { CurrencyField, Field, FormError, useAuthSubmit } from "./form-parts";

export function SignupForm() {
  const t = useTranslations("SignupPage");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const { error, pending, submit } = useAuthSubmit();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    return submit(
      () =>
        signUpWithEmail({
          name: String(form.get("name")),
          email: String(form.get("email")),
          password: String(form.get("password")),
          currency: String(form.get("currency")),
          callbackURL: "/home",
        }),
      () => router.push("/check-email"),
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label={tAuth("name")} name="name" autoComplete="name" required />
      <Field
        label={tAuth("email")}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Field
        label={tAuth("password")}
        hint={tAuth("passwordHint")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <CurrencyField />
      <FormError code={error} />
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-xs text-muted-foreground">
        {t.rich("agreement", {
          terms: (chunks) => (
            <Link href="/terms" className="underline underline-offset-4">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className="underline underline-offset-4">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
