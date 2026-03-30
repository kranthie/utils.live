import type { MetadataRoute } from "next";
import { getAllToolCards, getCategorySummaries } from "@/lib/tools/get-tool";
import { allPosts, getAllSlugs } from "@/lib/blog";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://utils.live";

// Use a stable build-time date so search engines can accurately judge freshness.
// Regenerated each build, but stays constant within a single deployment.
const BUILD_DATE = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const tools = getAllToolCards();
  const categories = getCategorySummaries();

  // Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: BUILD_DATE,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Blog post pages
  const blogPosts: MetadataRoute.Sitemap = getAllSlugs().map((slug) => {
    const post = allPosts.find((p) => p.slug === slug);
    return {
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: post ? new Date(post.publishedAt) : BUILD_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/tools/${category.id}`,
    lastModified: BUILD_DATE,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

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
  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => {
    const parts = tool.id.split("/");
    return {
      url: `${BASE_URL}/tools/${parts[0] ?? ""}/${parts[1] ?? ""}`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly" as const,
      priority: HIGH_TRAFFIC_TOOLS.has(tool.id) ? 0.9 : 0.75,
    };
  });

  return [...staticPages, ...blogPosts, ...categoryPages, ...toolPages];
}
