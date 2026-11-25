import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CheckEmailPage");
  return { title: t("title"), robots: { index: false } };
}

// Where signing up leads: the account can't be used until the email is verified.
export default function CheckEmailPage() {
  const t = useTranslations("CheckEmailPage");
  return (
    <AuthCard title={t("title")} intro={t("body")}>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
      <Link
        href="/login"
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        {t("logIn")}
      </Link>
    </AuthCard>
  );
}
