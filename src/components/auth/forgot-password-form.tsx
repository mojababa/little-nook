"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

import { Field, FormError, useAuthSubmit } from "./form-parts";

export function ForgotPasswordForm() {
  const t = useTranslations("ForgotPasswordPage");
  const tAuth = useTranslations("Auth");
  const { error, pending, submit } = useAuthSubmit();
  const [sent, setSent] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    return submit(
      () =>
        authClient.requestPasswordReset({
          email: String(form.get("email")),
          redirectTo: "/reset-password",
        }),
      () => setSent(true),
    );
  }

  if (sent) {
    return (
      <p role="status" className="rounded-lg border p-3 text-sm">
        {t("sent")}
      </p>
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
      <FormError code={error} />
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
