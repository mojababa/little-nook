"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { signUpWithEmail } from "@/lib/auth-client";
import { currencies } from "@/lib/currencies";

import { Field, FormError, toErrorCode } from "./form-parts";

export function SignupForm() {
  const t = useTranslations("SignupPage");
  const tAuth = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<ReturnType<typeof toErrorCode> | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  const currencyNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: "currency" }),
    [locale],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await signUpWithEmail({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      currency: String(form.get("currency")),
      callbackURL: "/home",
    });
    if (error) {
      setError(toErrorCode(error));
      setPending(false);
      return;
    }
    router.push("/check-email");
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="field-currency">{tAuth("currency")}</Label>
        <NativeSelect
          id="field-currency"
          name="currency"
          defaultValue="EUR"
          className="w-full [&_select]:h-10"
          aria-describedby="field-currency-hint"
        >
          {currencies.map((code) => (
            <NativeSelectOption key={code} value={code}>
              {code} · {currencyNames.of(code)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p id="field-currency-hint" className="text-xs text-muted-foreground">
          {tAuth("currencyHint")}
        </p>
      </div>
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
