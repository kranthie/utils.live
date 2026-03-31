/**
 * Cloudflare Pages Function — root locale redirect middleware.
 *
 * Intercepts requests to the bare root path "/" and redirects visitors to
 * their preferred locale, e.g. /en/. Uses Accept-Language header negotiation
 * via @formatjs/intl-localematcher + negotiator (both < 5 KB).
 *
 * This runs at the Cloudflare edge in < 1ms with no cold-start overhead.
 * It only fires for the root path; all other paths pass through untouched.
 *
 * NOTE: This file is excluded from the Next.js TypeScript compilation
 * (see tsconfig.json "exclude"). It is compiled by Cloudflare's build system.
 */
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const SUPPORTED_LOCALES = ["en"];
const DEFAULT_LOCALE = "en";

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);

  // Only intercept the bare root path
  if (url.pathname !== "/" && url.pathname !== "") {
    return ctx.next();
  }

  const acceptLanguage = ctx.request.headers.get("Accept-Language") ?? "";
  const headers = { "accept-language": acceptLanguage };
  const languages = new Negotiator({ headers }).languages();
  const locale = match(languages, SUPPORTED_LOCALES, DEFAULT_LOCALE);

  return new Response(null, {
    status: 302,
    headers: { Location: `${url.origin}/${locale}/` },
  });
};
