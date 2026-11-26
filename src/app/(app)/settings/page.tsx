import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { SessionGate } from "@/components/app/session-gate";
import { SignInMethods } from "@/components/app/sign-in-methods";
import { GoogleErrorNotice } from "@/components/auth/google-sign-in";
import { isGoogleSignInEnabled } from "@/server/auth";
import { requireSignInMethods } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AppPages.settings");
  return { title: t("title") };
}

export default function SettingsPage() {
  const t = useTranslations("AppPages.settings");
  return (
    <main className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <Suspense>
        {/* Linking Google comes back here with ?error= when it fails. */}
        <GoogleErrorNotice />
      </Suspense>
      <Suspense>
        <SessionGate>
          <SignInMethodsSection />
        </SessionGate>
      </Suspense>
    </main>
  );
}

async function SignInMethodsSection() {
  const methods = await requireSignInMethods();
  return (
    <SignInMethods {...methods} googleAvailable={isGoogleSignInEnabled()} />
  );
}
