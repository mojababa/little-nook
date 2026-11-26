import { useTranslations } from "next-intl";

import { LogOutButton } from "@/components/app/log-out-button";

// Steps a logged-in user goes through before the app: no app navigation yet,
// but a way out.
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Metadata");
  return (
    <>
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-lg font-semibold tracking-tight">
          {t("title")}
        </span>
        <LogOutButton />
      </header>
      {children}
    </>
  );
}
