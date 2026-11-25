"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

import { Field, FormError, toErrorCode } from "./form-parts";

/**
 * The emailed reset link goes through /api/auth/reset-password/:token, which
 * sends the user here with `?token=…`, or `?error=INVALID_TOKEN` when the link
 * is invalid or expired.
 */
export function ResetPasswordForm() {
  const t = useTranslations("ResetPasswordPage");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<ReturnType<typeof toErrorCode> | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  if (!token || error === "INVALID_TOKEN") {
    return (
      <div className="flex flex-col gap-5">
        <p role="alert" className="text-sm text-destructive">
          {t("invalidLink")}
        </p>
        <Link
          href="/forgot-password"
          className={buttonVariants({ size: "lg", className: "h-10" })}
        >
          {t("requestNew")}
        </Link>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({
      newPassword: String(form.get("password")),
      token: token!,
    });
    if (error) {
      setError(toErrorCode(error));
      setPending(false);
      return;
    }
    router.replace("/login?reset=done");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field
        label={tAuth("newPassword")}
        hint={tAuth("passwordHint")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormError code={error} />
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
