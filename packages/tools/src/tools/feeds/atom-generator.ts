import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("My Feed").describe("Feed title"),
  link: z.string().default("https://example.com").describe("Feed link URL"),
  authorName: z.string().default("Author").describe("Feed author name"),
  authorEmail: z.string().optional().describe("Feed author email"),
  entries: z
    .string()
    .default("[]")
    .describe("JSON array of entries with title, link, summary, updated"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Atom XML"),
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
  let entries: Array<Record<string, string>> = [];

  if (input.entries && input.entries.trim() !== "[]") {
    try {
      entries = JSON.parse(input.entries) as Array<Record<string, string>>;
      if (!Array.isArray(entries)) {
        throw new Error("Entries must be a JSON array");
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error("Invalid JSON in entries field");
      }
      throw e;
    }
  }

  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<feed xmlns="http://www.w3.org/2005/Atom">');
  lines.push(`  <title>${escapeXml(input.title)}</title>`);
  lines.push(`  <link href="${escapeXml(input.link)}"/>`);
  lines.push(`  <link href="${escapeXml(input.link)}/feed.atom" rel="self"/>`);
  lines.push(`  <id>${escapeXml(input.link)}/</id>`);
  lines.push(`  <updated>${now}</updated>`);
  lines.push("  <author>");
  lines.push(`    <name>${escapeXml(input.authorName)}</name>`);
  if (input.authorEmail) {
    lines.push(`    <email>${escapeXml(input.authorEmail)}</email>`);
  }
  lines.push("  </author>");

  for (const entry of entries) {
    lines.push("  <entry>");
    if (entry.title) lines.push(`    <title>${escapeXml(entry.title)}</title>`);
    if (entry.link) {
      lines.push(`    <link href="${escapeXml(entry.link)}"/>`);
      lines.push(`    <id>${escapeXml(entry.id ?? entry.link)}</id>`);
    }
    lines.push(`    <updated>${entry.updated ?? now}</updated>`);
    if (entry.published)
      lines.push(`    <published>${entry.published}</published>`);
    if (entry.summary)
      lines.push(`    <summary>${escapeXml(entry.summary)}</summary>`);
    if (entry.content) {
      lines.push(
        `    <content type="html"><![CDATA[${entry.content}]]></content>`
      );
    }
    if (entry.authorName) {
      lines.push("    <author>");
      lines.push(`      <name>${escapeXml(entry.authorName)}</name>`);
      lines.push("    </author>");
    }
    lines.push("  </entry>");
  }

  lines.push("</feed>");

  return { output: lines.join("\n") };
}

export const atomGenerator = defineTool({
  meta: {
    id: "feeds/atom-generator",
    name: "Atom Generator",
    description:
      "Free online Atom feed generator — create valid Atom 1.0 XML feeds with entries, authors, and metadata instantly in your browser. No data is stored. Supports entry summaries, content, published dates, and per-entry authors.",
    category: "feeds",
    subgroup: "RSS & Atom",
    tier: ToolTier.CLIENT,
    keywords: [
      "atom",
      "feed",
      "generate",
      "xml",
      "syndication",
      "blog",
      "subscribe",
    ],
    ui: { outputRenderer: "code", outputLanguage: "xml" },
    examples: [
      {
        title: "Tech blog Atom feed with one entry",
        description:
          "Generate an Atom 1.0 XML feed with a single blog post entry",
        input: {
          title: "Tech Blog",
          link: "https://blog.example.com",
          authorName: "Jane Doe",
          entries:
            '[{"title":"First Post","link":"https://blog.example.com/first","summary":"Welcome to my blog"}]',
        },
        output: "Atom XML feed with 1 entry",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
