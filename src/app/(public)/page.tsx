import Link from "next/link";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";

const features = ["inventory", "patterns", "projects", "finances"] as const;

export default function LandingPage() {
  const t = useTranslations("LandingPage");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-14 px-6 py-12">
      <section className="flex flex-col items-center gap-5 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-xl">{t("tagline")}</p>
        <p className="max-w-xl text-muted-foreground">{t("description")}</p>
        <div className="flex gap-3">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            {t("signUp")}
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            {t("logIn")}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          {t("featuresTitle")}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="rounded-xl border p-5">
              <h3 className="font-semibold">
                {t(`features.${feature}.title`)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`features.${feature}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-sm text-muted-foreground">
        {t("install")}
      </p>
    </main>
  );
}
