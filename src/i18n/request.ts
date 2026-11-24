import { getRequestConfig } from "next-intl/server";

import { defaultLocale } from "./config";

// No locale routing: the locale will come from the user's saved preference.
// Until preferences exist, everyone gets the default locale.
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
