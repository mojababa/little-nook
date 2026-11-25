import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignupPage");
  return { title: t("title") };
}

export default function SignupPage() {
  const t = useTranslations("SignupPage");
  return (
    <AuthCard title={t("title")} intro={t("intro")}>
      <SignupForm />
      <p className="text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-foreground underline">
          {t("logIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
