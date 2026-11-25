import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { getWorkspace } from "@/server/accounts/workspaces";
import { requireUser, requireWorkspaceContext } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AppPages.home");
  return { title: t("title") };
}

export default async function HomePage() {
  const t = await getTranslations("AppPages");
  return (
    <main className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("home.title")}
      </h1>
      <Suspense>
        <Welcome />
      </Suspense>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </main>
  );
}

async function Welcome() {
  const t = await getTranslations("AppPages.home");
  const [user, ctx] = await Promise.all([
    requireUser(),
    requireWorkspaceContext(),
  ]);
  const workspace = await getWorkspace(ctx);
  return (
    <>
      <p className="text-lg">{t("greeting", { name: user.name })}</p>
      <p className="text-muted-foreground">
        {t("workspace", {
          workspace: workspace.name,
          currency: workspace.currency,
        })}
      </p>
    </>
  );
}
