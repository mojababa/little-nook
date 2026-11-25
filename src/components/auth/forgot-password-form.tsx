"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

import { Field, FormError, toErrorCode } from "./form-parts";

export function ForgotPasswordForm() {
  const t = useTranslations("ForgotPasswordPage");
  const tAuth = useTranslations("Auth");
  const [error, setError] = useState<ReturnType<typeof toErrorCode> | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/reset-password",
    });
    setPending(false);
    if (error) {
      setError(toErrorCode(error));
      return;
    }
    setSent(true);
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
