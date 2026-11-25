"use client";

import {
  BookOpen,
  House,
  Package,
  Settings,
  SquareKanban,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { appSections, type AppSection } from "@/lib/app-sections";
import { cn } from "@/lib/utils";

const icons: Record<AppSection["key"], LucideIcon> = {
  home: House,
  inventory: Package,
  patterns: BookOpen,
  projects: SquareKanban,
  offers: Tag,
  finances: Wallet,
  settings: Settings,
};

function useIsCurrent() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop: every section in a sidebar. */
export function AppSidebarNav() {
  const t = useTranslations("AppNav");
  const isCurrent = useIsCurrent();
  return (
    <nav aria-label={t("label")}>
      <ul className="flex flex-col gap-1">
        {appSections.map(({ key, href }) => {
          const Icon = icons[key];
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={isCurrent(href) ? "page" : undefined}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
              >
                <Icon className="size-4" aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile: a bottom tab bar. Settings lives in the top bar instead. */
export function AppTabBarNav() {
  const t = useTranslations("AppNav");
  const isCurrent = useIsCurrent();
  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-6">
        {appSections
          .filter(({ key }) => key !== "settings")
          .map(({ key, href }) => {
            const Icon = icons[key];
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={isCurrent(href) ? "page" : undefined}
                  className="flex flex-col items-center gap-1 px-1 py-2 text-[0.7rem] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="max-w-full truncate">{t(key)}</span>
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}

export function SettingsLink({ className }: { className?: string }) {
  const t = useTranslations("AppNav");
  const isCurrent = useIsCurrent();
  return (
    <Link
      href="/settings"
      aria-label={t("settings")}
      aria-current={isCurrent("/settings") ? "page" : undefined}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:text-foreground",
        className,
      )}
    >
      <Settings className="size-5" aria-hidden />
    </Link>
  );
}
