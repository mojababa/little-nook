import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { getDb } from "@/db";
import { workspaceContextForUser } from "@/server/accounts/workspace-context";
import { requireUser } from "@/server/session";

import { WorkspaceSetupForm } from "./workspace-setup-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("WelcomePage");
  return { title: t("title") };
}

/** First login after signing up with Google: choose the workspace currency. */
export default function WelcomePage() {
  const t = useTranslations("WelcomePage");
  return (
    <AuthCard title={t("title")} intro={t("intro")}>
      <Suspense>
        <NewUserGate>
          <WorkspaceSetupForm />
        </NewUserGate>
      </Suspense>
    </AuthCard>
  );
}

/** Lets through only logged-in users who have no workspace yet. */
async function NewUserGate({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (await workspaceContextForUser(getDb(), user.id)) redirect("/home");
  return children;
}
