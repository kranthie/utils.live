import { locales, defaultLocale } from "@/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://utils.live";

/**
 * Builds `alternates` metadata for hreflang tags.
 *
 * Usage in generateMetadata:
 * ```ts
 * return { alternates: buildAlternates(locale, '/tools/') };
 * ```
 */
export function buildAlternates(
  currentLocale: string,
  path: string
): {
  canonical: string;
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = `${BASE_URL}/${locale}${path}`;
  }
  // x-default points to the default locale variant
  languages["x-default"] = `${BASE_URL}/${defaultLocale}${path}`;

  return {
    canonical: `${BASE_URL}/${currentLocale}${path}`,
    languages,
  };
}
