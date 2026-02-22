import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  urls: z
    .string()
    .default(
      "https://example.com/\nhttps://example.com/about\nhttps://example.com/contact"
    )
    .describe("URLs, one per line"),
  changefreq: z
    .enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"])
    .default("weekly")
    .describe("Default change frequency"),
  priority: z
    .number()
    .min(0)
    .max(1)
    .default(0.8)
    .describe("Default priority (0.0 - 1.0)"),
  lastmod: z
    .string()
    .default("")
    .describe("Last modified date (ISO 8601, e.g. 2024-01-15)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated XML sitemap"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const urls = input.urls
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    throw new Error("At least one URL is required");
  }

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const url of urls) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(url)}</loc>`);
    if (input.lastmod) {
      lines.push(`    <lastmod>${input.lastmod}</lastmod>`);
    }
    lines.push(`    <changefreq>${input.changefreq}</changefreq>`);
    lines.push(`    <priority>${input.priority.toFixed(1)}</priority>`);
    lines.push("  </url>");
  }

  lines.push("</urlset>");

  return { output: lines.join("\n") };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const sitemapGenerator = defineTool({
  meta: {
    id: "web/sitemap-generator",
    name: "Sitemap Generator",
    description:
      "Free online XML sitemap generator — create sitemap.xml files with change frequency, priority, and last-modified settings instantly in your browser. No data is stored. Supports multiple URLs with configurable SEO metadata per entry.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "sitemap",
      "xml",
      "seo",
      "generator",
      "search engine",
      "urls",
      "google",
      "search-console",
      "crawl",
      "index",
      "changefreq",
      "priority",
    ],
    ui: {
      outputLanguage: "xml",
    },
    examples: [
      {
        title: "Three-page sitemap with weekly update frequency",
        description:
          "Generate an XML sitemap for homepage, about, and blog pages with weekly change frequency",
        input: {
          urls: "https://example.com/\nhttps://example.com/about\nhttps://example.com/blog",
          changefreq: "weekly",
          priority: 0.8,
          lastmod: "",
        },
        output:
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://example.com/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n  <url>\n    <loc>https://example.com/about</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n  <url>\n    <loc>https://example.com/blog</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
