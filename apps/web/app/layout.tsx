import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { KeyboardProvider } from "@/components/providers/keyboard-provider";
import { GlobalSearch } from "@/components/search/global-search";
import { getToolCountLabel } from "@/lib/tools/get-tool";
import { getSearchTools, getSearchCategories } from "@/lib/search-data";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const toolCountLabel = getToolCountLabel();

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  // Generate search data server-side to avoid importing @utils-live/tools in the client bundle
  const searchTools = getSearchTools();
  const searchCategories = getSearchCategories();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <KeyboardProvider>
            {children}
            <GlobalSearch tools={searchTools} categories={searchCategories} />
            <ToastProvider />
          </KeyboardProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
