import type { MetadataRoute } from "next";
import { getAllToolCards, getCategorySummaries } from "@/lib/tools/get-tool";
import { allPosts, getAllSlugs } from "@/lib/blog";
import { locales } from "@/i18n/config";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://utils.live";

// Use a stable build-time date so search engines can accurately judge freshness.
// Regenerated each build, but stays constant within a single deployment.
const BUILD_DATE = new Date();

/** Build per-locale alternates for hreflang */
function localeAlternates(path: string): Record<string, string> {
  return Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${path}`]));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const tools = getAllToolCards();
  const categories = getCategorySummaries();

  // Static marketing pages — emitted for every locale
  const staticPaths: Array<{
    path: string;
    freq: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", freq: "weekly", priority: 1 },
    { path: "/tools/", freq: "daily", priority: 0.9 },
    { path: "/about/", freq: "monthly", priority: 0.6 },
    { path: "/contact/", freq: "monthly", priority: 0.5 },
    { path: "/blog/", freq: "weekly", priority: 0.7 },
  ];

  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map(({ path, freq, priority }) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: BUILD_DATE,
      changeFrequency: freq,
      priority,
      alternates: { languages: localeAlternates(path) },
    }))
  );

  // Blog post pages
  const blogPosts: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getAllSlugs().map((slug) => {
      const post = allPosts.find((p) => p.slug === slug);
      return {
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        lastModified: post ? new Date(post.publishedAt) : BUILD_DATE,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages: localeAlternates(`/blog/${slug}`) },
      };
    })
  );

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    categories.map((category) => ({
      url: `${BASE_URL}/${locale}/tools/${category.id}/`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: localeAlternates(`/tools/${category.id}/`),
      },
    }))
  );

  // High-traffic tools that get boosted crawl priority
  const HIGH_TRAFFIC_TOOLS = new Set([
    "encoding/base64-decode",
    "encoding/base64-encode",
    "json/formatter",
    "identifiers/uuid-v4-generator",
    "regex/regex-tester",
    "crypto/md5-hash",
    "crypto/sha256-hash",
    "jwt/jwt-decoder",
    "encoding/url-encode",
    "encoding/url-decode",
  ]);

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    tools.map((tool) => {
      const parts = tool.id.split("/");
      const toolPath = `/tools/${parts[0] ?? ""}/${parts[1] ?? ""}/`;
      return {
        url: `${BASE_URL}/${locale}${toolPath}`,
        lastModified: BUILD_DATE,
        changeFrequency: "weekly" as const,
        priority: HIGH_TRAFFIC_TOOLS.has(tool.id) ? 0.9 : 0.75,
        alternates: { languages: localeAlternates(toolPath) },
      };
    })
  );

  return [...staticPages, ...blogPosts, ...categoryPages, ...toolPages];
}
