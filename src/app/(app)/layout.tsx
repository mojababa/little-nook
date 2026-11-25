import Link from "next/link";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import {
  AppSidebarNav,
  AppTabBarNav,
  SettingsLink,
} from "@/components/app/app-nav";
import { LogOutButton } from "@/components/app/log-out-button";
import { SessionGate } from "@/components/app/session-gate";

// The logged-in app. The chrome is static; everything under it waits for the
// session check, which redirects to /login when no one is logged in. Layouts
// don't re-render on client-side navigation, so pages check the session too.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Metadata");
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r px-3 py-5 md:flex">
        <Link
          href="/home"
          className="px-3 text-lg font-semibold tracking-tight"
        >
          {t("title")}
        </Link>
        <div className="flex-1">
          <AppSidebarNav />
        </div>
        <LogOutButton showLabel />
      </aside>

      <header className="flex items-center justify-between border-b px-4 py-2 md:hidden">
        <Link href="/home" className="text-lg font-semibold tracking-tight">
          {t("title")}
        </Link>
        <div className="flex items-center">
          <SettingsLink />
          <LogOutButton />
        </div>
      </header>

      <div className="flex flex-1 flex-col px-4 pt-6 pb-24 md:px-10 md:pb-10">
        <Suspense>
          <SessionGate>{children}</SessionGate>
        </Suspense>
      </div>

      <div className="md:hidden">
        <AppTabBarNav />
      </div>
    </div>
  );
}
