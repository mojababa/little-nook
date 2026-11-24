import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  "account",
  "content",
  "use",
  "service",
  "liability",
  "ending",
  "changes",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("TermsPage");
  return { title: t("title") };
}

export default function TermsPage() {
  const t = useTranslations("TermsPage");
  return (
    <LegalDocument
      title={t("title")}
      lastUpdated={t("lastUpdated")}
      intro={t("intro")}
      sections={sections.map((id) => ({
        id,
        title: t(`sections.${id}.title`),
        body: t(`sections.${id}.body`),
      }))}
    />
  );
}
