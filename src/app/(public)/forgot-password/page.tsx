import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ForgotPasswordPage");
  return { title: t("title") };
}

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPasswordPage");
  return (
    <AuthCard title={t("title")} intro={t("intro")}>
      <ForgotPasswordForm />
      <Link href="/login" className="text-sm underline">
        {t("backToLogin")}
      </Link>
    </AuthCard>
  );
}
