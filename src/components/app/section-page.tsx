import { useTranslations } from "next-intl";

import type { AppSection } from "@/lib/app-sections";

/** A section of the app that has no content yet. */
export function PlaceholderSection({
  section,
}: {
  section: Exclude<AppSection["key"], "home">;
}) {
  const t = useTranslations("AppPages");
  return (
    <main className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t(`${section}.title`)}
      </h1>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </main>
  );
}
