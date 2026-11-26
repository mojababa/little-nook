"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { CurrencyField, FormError } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";

import { setUpWorkspace, type SetUpWorkspaceState } from "./actions";

const initialState: SetUpWorkspaceState = { error: null };

export function WorkspaceSetupForm() {
  const t = useTranslations("WelcomePage");
  const [state, action, pending] = useActionState(setUpWorkspace, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <CurrencyField />
      <FormError code={state.error} />
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
