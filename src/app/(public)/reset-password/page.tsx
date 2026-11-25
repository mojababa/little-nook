import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ResetPasswordPage");
  return { title: t("title"), robots: { index: false } };
}

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPasswordPage");
  return (
    <AuthCard title={t("title")}>
      {/* The form needs the token from the URL. */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
