import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm, PasswordResetNotice } from "@/components/auth/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LoginPage");
  return { title: t("title") };
}

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  return (
    <AuthCard title={t("title")}>
      <Suspense>
        <PasswordResetNotice />
      </Suspense>
      <LoginForm />
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-foreground underline">
          {t("forgotPassword")}
        </Link>
        <p>
          {t("noAccount")}{" "}
          <Link href="/signup" className="text-foreground underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
