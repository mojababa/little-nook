import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PlaceholderSection } from "@/components/app/section-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AppPages.offers");
  return { title: t("title") };
}

export default function OffersPage() {
  return <PlaceholderSection section="offers" />;
}
