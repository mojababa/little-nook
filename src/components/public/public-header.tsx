import Link from "next/link";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";

export function PublicHeader() {
  const t = useTranslations("PublicHeader");
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        {t("home")}
      </Link>
      <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
        {t("logIn")}
      </Link>
    </header>
  );
}
