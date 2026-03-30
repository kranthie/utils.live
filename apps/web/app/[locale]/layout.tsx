import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { KeyboardProvider } from "@/components/providers/keyboard-provider";
import { GlobalSearch } from "@/components/search/global-search";
import { getToolCountLabel } from "@/lib/tools/get-tool";
import { getSearchTools, getSearchCategories } from "@/lib/search-data";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const toolCountLabel = getToolCountLabel();

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "utils.live | Developer Utilities Platform",
    template: "%s | utils.live",
  },
  description: `${toolCountLabel} developer tools in one place. JSON formatters, encoders, converters, and more. Free and privacy-focused.`,
  keywords: [
    "developer tools",
    "online developer tools",
    "json formatter",
    "json formatter online",
    "base64 encoder",
    "base64 decode online",
    "uuid generator",
    "uuid generator online",
    "regex tester",
    "regex tester online",
    "md5 hash generator",
    "sha256 generator",
    "jwt decoder",
    "url encoder decoder",
    "utils",
    "utilities",
    "free developer tools",
  ],
  authors: [{ name: "utils.live" }],
  creator: "utils.live",
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://utils.live",
    siteName: "utils.live",
    title: "utils.live | Developer Utilities Platform",
    description: `${toolCountLabel} developer tools in one place. JSON formatters, encoders, converters, and more.`,
    images: [
      {
        url: "https://utils.live/og/default.png",
        width: 1200,
        height: 630,
        alt: "utils.live - Free Developer Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "utils.live | Developer Utilities Platform",
    description: `${toolCountLabel} developer tools in one place. JSON formatters, encoders, converters, and more.`,
    images: [
      {
        url: "https://utils.live/og/default.png",
        width: 1200,
        height: 630,
        alt: "utils.live - Free Developer Tools",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load messages directly (avoids next-intl/config alias requirement with Turbopack)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const messages = (await import(`@/messages/${locale}.json`))
    .default as Record<string, unknown>;

  // Generate search data server-side to avoid importing @utils-live/tools in the client bundle
  const searchTools = getSearchTools();
  const searchCategories = getSearchCategories();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <KeyboardProvider>
              {children}
              <GlobalSearch tools={searchTools} categories={searchCategories} />
              <ToastProvider />
            </KeyboardProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
