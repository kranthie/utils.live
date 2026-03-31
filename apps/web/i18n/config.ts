export const locales = [
  "en",
  "es",
  "de",
  "fr",
  "ja",
  "ko",
  "pt-BR",
  "ru",
  "tr",
  "zh-CN",
  "zh-TW",
] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
