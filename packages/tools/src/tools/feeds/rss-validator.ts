import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("RSS feed XML to validate"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the RSS feed is valid"),
  version: z.string().optional().describe("Detected RSS version"),
  errors: z.array(z.string()).describe("Validation errors"),
  warnings: z.array(z.string()).describe("Validation warnings"),
  stats: z.object({
    itemCount: z.number(),
    hasEnclosures: z.boolean(),
    hasCategories: z.boolean(),
  }),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function hasTag(xml: string, tag: string): boolean {
  const regex = new RegExp(`<${tag}[\\s>]`, "i");
  return regex.test(xml);
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1]!.trim() : "";
}

function countOccurrences(xml: string, tag: string): number {
  const regex = new RegExp(`<${tag}[\\s>]`, "gi");
  const matches = xml.match(regex);
  return matches ? matches.length : 0;
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const xml = input.input.trim();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check XML declaration
  if (!xml.startsWith("<?xml")) {
    warnings.push('Missing XML declaration (<?xml version="1.0"?>)');
  }

  // Check RSS root
  if (!xml.includes("<rss")) {
    errors.push("Missing <rss> root element");
    return {
      valid: false,
      errors,
      warnings,
      stats: { itemCount: 0, hasEnclosures: false, hasCategories: false },
    };
  }

  // Detect version
  let version: string | undefined;
  const versionMatch = xml.match(/version=["']([^"']*)["']/);
  if (versionMatch) {
    version = versionMatch[1];
    if (
      version !== "2.0" &&
      version !== "0.91" &&
      version !== "0.92" &&
      version !== "1.0"
    ) {
      warnings.push(`Unusual RSS version: ${version}`);
    }
  } else {
    errors.push("Missing version attribute on <rss> element");
  }

  // Check channel
  if (!hasTag(xml, "channel")) {
    errors.push("Missing required <channel> element");
  } else {
    const channel = xml.match(/<channel[\s>][\s\S]*<\/channel>/i)?.[0] ?? xml;

    if (!extractTag(channel, "title")) {
      errors.push("Missing required <title> in <channel>");
    }
    if (!extractTag(channel, "link")) {
      errors.push("Missing required <link> in <channel>");
    }
    if (!extractTag(channel, "description")) {
      errors.push("Missing required <description> in <channel>");
    }

    if (!extractTag(channel, "language")) {
      warnings.push("Missing recommended <language> in <channel>");
    }
    if (
      !extractTag(channel, "lastBuildDate") &&
      !extractTag(channel, "pubDate")
    ) {
      warnings.push("Missing recommended date element in <channel>");
    }
  }

  // Check items
  const itemCount = countOccurrences(xml, "item");
  if (itemCount === 0) {
    warnings.push("No <item> elements found");
  }

  // Check items have required elements
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/gi;
  let itemMatch;
  let itemIdx = 0;
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    itemIdx++;
    const item = itemMatch[0];
    const hasTitle = hasTag(item, "title");
    const hasDescription = hasTag(item, "description");
    if (!hasTitle && !hasDescription) {
      errors.push(
        `Item ${itemIdx}: must have at least <title> or <description>`
      );
    }
  }

  const hasEnclosures = xml.includes("<enclosure");
  const hasCategories = hasTag(xml, "category");

  return {
    valid: errors.length === 0,
    version,
    errors,
    warnings,
    stats: {
      itemCount,
      hasEnclosures,
      hasCategories,
    },
  };
}

export const rssValidator = defineTool({
  meta: {
    id: "feeds/rss-validator",
    name: "RSS Validator",
    description:
      "Free online RSS feed validator — check RSS XML structure, required elements, and best practices instantly in your browser. No data is stored. Reports errors (missing channel, title, link) and warnings (missing language, dates), detects RSS version.",
    category: "feeds",
    subgroup: "RSS & Atom",
    tier: ToolTier.CLIENT,
    keywords: ["rss", "feed", "validate", "check", "xml", "lint", "structure"],
    ui: { inputLanguage: "xml", outputRenderer: "json-tree" },
    examples: [
      {
        title: "Validate a minimal RSS 2.0 feed",
        description:
          "Check an RSS feed for required channel elements and item structure",
        input:
          '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>My Blog</title>\n    <link>https://example.com</link>\n    <description>A blog</description>\n    <item>\n      <title>Post 1</title>\n    </item>\n  </channel>\n</rss>',
        output: "Valid RSS feed with 1 item",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
