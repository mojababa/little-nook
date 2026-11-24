import Link from "next/link";
import { useTranslations } from "next-intl";

export function PublicFooter() {
  const t = useTranslations("PublicFooter");
  return (
    <footer className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label={t("label")} className="flex gap-6">
        <Link href="/privacy" className="hover:text-foreground">
          {t("privacy")}
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          {t("terms")}
        </Link>
      </nav>
      <p>{t("copyright")}</p>
    </footer>
  );
}
