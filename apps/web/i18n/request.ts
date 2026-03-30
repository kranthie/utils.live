import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && (routing.locales as ReadonlyArray<string>).includes(requested)
      ? requested
      : routing.defaultLocale;

  const messages: AbstractIntlMessages =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (await import(`../messages/${locale}.json`))
      .default as AbstractIntlMessages;

  return { locale, messages };
});
