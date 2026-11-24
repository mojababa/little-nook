import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

import { backgroundColor, themeColor } from "@/lib/brand";
import { defaultLocale } from "@/i18n/config";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({
    locale: defaultLocale,
    namespace: "Manifest",
  });
  return {
    id: "/",
    name: t("name"),
    short_name: t("shortName"),
    description: t("description"),
    lang: defaultLocale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
