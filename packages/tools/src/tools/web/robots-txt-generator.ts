import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  sitemapUrl: z
    .string()
    .default("https://example.com/sitemap.xml")
    .describe("Sitemap URL"),
  allowAll: z.boolean().default(true).describe("Allow all bots by default"),
  disallowPaths: z
    .string()
    .default("/admin/\n/private/")
    .describe("Paths to disallow (one per line)"),
  allowPaths: z
    .string()
    .default("")
    .describe("Paths to explicitly allow (one per line)"),
  crawlDelay: z
    .number()
    .min(0)
    .max(60)
    .default(0)
    .describe("Crawl delay in seconds (0 = none)"),
  additionalBots: z
    .string()
    .default("")
    .describe(
      "Additional bot-specific rules (format: BotName:disallow_path, one per line)"
    ),
});

const outputSchema = z.object({
  output: z.string().describe("Generated robots.txt content"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const lines: string[] = [];

  // Default user-agent rules
  lines.push("User-agent: *");

  if (input.allowAll) {
    // Allow everything except specified paths
    const allowPaths = input.allowPaths
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    for (const path of allowPaths) {
      lines.push(`Allow: ${path}`);
    }
  } else {
    lines.push("Disallow: /");
  }

  const disallowPaths = input.disallowPaths
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  for (const path of disallowPaths) {
    lines.push(`Disallow: ${path}`);
  }

  if (input.crawlDelay > 0) {
    lines.push(`Crawl-delay: ${input.crawlDelay}`);
  }

  // Additional bot-specific rules
  if (input.additionalBots.trim()) {
    const botRules = input.additionalBots
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    for (const rule of botRules) {
      const colonIdx = rule.indexOf(":");
      if (colonIdx > 0) {
        const bot = rule.substring(0, colonIdx).trim();
        const path = rule.substring(colonIdx + 1).trim();
        lines.push("");
        lines.push(`User-agent: ${bot}`);
        lines.push(`Disallow: ${path}`);
      }
    }
  }

  // Sitemap
  if (input.sitemapUrl) {
    lines.push("");
    lines.push(`Sitemap: ${input.sitemapUrl}`);
  }

  return { output: lines.join("\n") };
}

export const robotsTxtGenerator = defineTool({
  meta: {
    id: "web/robots-txt-generator",
    name: "robots.txt Generator",
    description:
      "Free online robots.txt generator — create crawler directives with disallow paths, sitemap URL, and crawl delay settings instantly in your browser. No data is stored. Supports custom bot-specific rules and multiple path entries.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "robots.txt",
      "seo",
      "crawl",
      "generator",
      "web",
      "sitemap",
      "crawler",
      "googlebot",
      "search-engine",
      "disallow",
      "allow",
      "user-agent",
    ],
    examples: [
      {
        title: "Standard robots.txt blocking admin and API paths",
        description:
          "Generate a robots.txt that allows crawling but blocks admin, private, and API directories",
        input: {
          sitemapUrl: "https://example.com/sitemap.xml",
          allowAll: true,
          disallowPaths: "/admin/\n/private/\n/api/",
          allowPaths: "",
          crawlDelay: 0,
          additionalBots: "",
        },
        output:
          "User-agent: *\nDisallow: /admin/\nDisallow: /private/\nDisallow: /api/\n\nSitemap: https://example.com/sitemap.xml",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
