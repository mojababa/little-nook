import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PlaceholderSection } from "@/components/app/placeholder-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AppPages.inventory");
  return { title: t("title") };
}

export default function InventoryPage() {
  return <PlaceholderSection section="inventory" />;
}
