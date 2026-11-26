"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { currencies } from "@/lib/currencies";

const errorCodes = [
  "INVALID_EMAIL_OR_PASSWORD",
  "EMAIL_NOT_VERIFIED",
  "PASSWORD_TOO_SHORT",
  "PASSWORD_TOO_LONG",
  "INVALID_EMAIL",
  "INVALID_CURRENCY",
  "INVALID_TOKEN",
  "TOO_MANY_REQUESTS",
  "FAILED_TO_UNLINK_LAST_ACCOUNT",
  "SESSION_NOT_FRESH",
] as const;

export type ErrorCode = (typeof errorCodes)[number] | "UNKNOWN";

type AuthClientError = { code?: string; status?: number };

/** Maps an auth client error to one of the messages in `Auth.errors`. */
function toErrorCode(error: AuthClientError): ErrorCode {
  if (error.status === 429) return "TOO_MANY_REQUESTS";
  return errorCodes.find((code) => code === error.code) ?? "UNKNOWN";
}

/**
 * Submit state for an auth form. `submit` runs an auth client call: on failure
 * it shows the error, on success it runs `onSuccess` and stays pending, so the
 * form can't be sent twice while the page moves on.
 */
export function useAuthSubmit() {
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(
    call: () => Promise<{ error: AuthClientError | null }>,
    onSuccess: () => void,
  ) {
    setPending(true);
    setError(null);
    const { error } = await call();
    if (error) {
      setError(toErrorCode(error));
      setPending(false);
      return;
    }
    onSuccess();
  }

  return { error, pending, submit };
}

export function FormError({ code }: { code: ErrorCode | null }) {
  const t = useTranslations("Auth.errors");
  if (!code) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {t(code)}
    </p>
  );
}

export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string; name: string } & React.ComponentProps<
  typeof Input
>) {
  const id = `field-${input.name}`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="h-10"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/** The workspace currency picker, submitted as `currency`. */
export function CurrencyField() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const currencyNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: "currency" }),
    [locale],
  );
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="field-currency">{t("currency")}</Label>
      <NativeSelect
        id="field-currency"
        name="currency"
        defaultValue="EUR"
        className="w-full [&_select]:h-10"
        aria-describedby="field-currency-hint"
      >
        {currencies.map((code) => (
          <NativeSelectOption key={code} value={code}>
            {code} · {currencyNames.of(code)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <p id="field-currency-hint" className="text-xs text-muted-foreground">
        {t("currencyHint")}
      </p>
    </div>
  );
}
