import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OfflinePage");
  return { title: t("title"), robots: { index: false } };
}

// Precached by the service worker and shown when a page can't be loaded.
export default function OfflinePage() {
  const t = useTranslations("OfflinePage");
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      {/* The service worker serves this page in place of the one requested, so an
          empty href reloads that page with a full navigation, even without JS. */}
      <a href="" className={buttonVariants({ size: "lg" })}>
        {t("retry")}
      </a>
    </main>
  );
}
