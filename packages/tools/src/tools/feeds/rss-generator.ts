import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("My Feed").describe("Feed title"),
  link: z.string().default("https://example.com").describe("Feed link URL"),
  description: z
    .string()
    .default("A sample RSS feed")
    .describe("Feed description"),
  language: z.string().default("en-us").describe("Feed language"),
  items: z
    .string()
    .default("[]")
    .describe("JSON array of items with title, link, description, pubDate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated RSS XML"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function execute(input: Input): Output {
  let items: Array<Record<string, string>> = [];

  if (input.items && input.items.trim() !== "[]") {
    try {
      items = JSON.parse(input.items) as Array<Record<string, string>>;
      if (!Array.isArray(items)) {
        throw new Error("Items must be a JSON array");
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error("Invalid JSON in items field");
      }
      throw e;
    }
  }

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
  lines.push("  <channel>");
  lines.push(`    <title>${escapeXml(input.title)}</title>`);
  lines.push(`    <link>${escapeXml(input.link)}</link>`);
  lines.push(`    <description>${escapeXml(input.description)}</description>`);
  lines.push(`    <language>${escapeXml(input.language)}</language>`);
  lines.push(`    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`);
  lines.push(
    `    <atom:link href="${escapeXml(input.link)}/feed.xml" rel="self" type="application/rss+xml"/>`
  );

  for (const item of items) {
    lines.push("    <item>");
    if (item.title) lines.push(`      <title>${escapeXml(item.title)}</title>`);
    if (item.link) lines.push(`      <link>${escapeXml(item.link)}</link>`);
    if (item.description)
      lines.push(
        `      <description><![CDATA[${item.description}]]></description>`
      );
    if (item.pubDate)
      lines.push(`      <pubDate>${escapeXml(item.pubDate)}</pubDate>`);
    if (item.guid) {
      lines.push(`      <guid>${escapeXml(item.guid)}</guid>`);
    } else if (item.link) {
      lines.push(`      <guid>${escapeXml(item.link)}</guid>`);
    }
    if (item.author)
      lines.push(`      <author>${escapeXml(item.author)}</author>`);
    if (item.category)
      lines.push(`      <category>${escapeXml(item.category)}</category>`);
    lines.push("    </item>");
  }

  lines.push("  </channel>");
  lines.push("</rss>");

  return { output: lines.join("\n") };
}

export const rssGenerator = defineTool({
  meta: {
    id: "feeds/rss-generator",
    name: "RSS Generator",
    description:
      "Free online RSS feed generator — create valid RSS 2.0 XML feeds with items, categories, and enclosures instantly in your browser. No data is stored. Supports item descriptions, publication dates, GUIDs, authors, and Atom self-links.",
    category: "feeds",
    subgroup: "RSS & Atom",
    tier: ToolTier.CLIENT,
    keywords: [
      "rss",
      "feed",
      "generate",
      "xml",
      "syndication",
      "blog",
      "podcast",
    ],
    ui: { outputRenderer: "code", outputLanguage: "xml" },
    examples: [
      {
        title: "Tech news RSS feed with one item",
        description: "Generate an RSS 2.0 feed with a single news article item",
        input: {
          title: "Tech News",
          link: "https://news.example.com",
          description: "Latest technology news",
          language: "en-us",
          items:
            '[{"title":"New Framework Released","link":"https://news.example.com/framework","description":"A new JS framework was released today"}]',
        },
        output: "RSS 2.0 XML feed with 1 item",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
