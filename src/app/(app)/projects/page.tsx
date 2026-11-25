import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PlaceholderSection } from "@/components/app/placeholder-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AppPages.projects");
  return { title: t("title") };
}

export default function ProjectsPage() {
  return <PlaceholderSection section="projects" />;
}
