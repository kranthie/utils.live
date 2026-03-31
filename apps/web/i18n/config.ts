// NOTE: Non-English locales temporarily disabled to stay within Cloudflare Pages
// free-plan page limit (20k). Translation files are preserved in /messages/.
// Re-add locales here when a solution is found (e.g. paid plan, ISR, etc.).
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
