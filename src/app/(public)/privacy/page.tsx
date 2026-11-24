import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  "collect",
  "use",
  "cookies",
  "sharing",
  "retention",
  "rights",
  "changes",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PrivacyPage");
  return { title: t("title") };
}

export default function PrivacyPage() {
  const t = useTranslations("PrivacyPage");
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
