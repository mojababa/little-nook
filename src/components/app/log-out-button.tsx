"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogOutButton({ showLabel = false }: { showLabel?: boolean }) {
  const t = useTranslations("AppNav");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "lg" : "icon-lg"}
      onClick={logOut}
      disabled={pending}
      aria-label={showLabel ? undefined : t("logOut")}
      className={showLabel ? "justify-start text-muted-foreground" : undefined}
    >
      <LogOut aria-hidden />
      {showLabel && t("logOut")}
    </Button>
  );
}
