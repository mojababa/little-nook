/**
 * Currencies a workspace can use (ISO 4217), in the order the signup picker
 * shows them. Display names come from `Intl.DisplayNames` in the UI locale.
 */
export const currencies = [
  "EUR",
  "USD",
  "GBP",
  "RSD",
  "BAM",
  "MKD",
  "CHF",
  "CAD",
  "AUD",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "ISK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "BGN",
  "TRY",
  "UAH",
  "ILS",
  "ZAR",
  "BRL",
  "MXN",
  "ARS",
  "CLP",
  "COP",
  "INR",
  "JPY",
  "CNY",
  "KRW",
  "SGD",
  "HKD",
  "TWD",
  "THB",
  "MYR",
  "IDR",
  "PHP",
  "VND",
  "AED",
  "SAR",
] as const;

export type Currency = (typeof currencies)[number];

export function isCurrency(value: unknown): value is Currency {
  return (currencies as readonly unknown[]).includes(value);
}
