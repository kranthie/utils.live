import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Atom feed XML content"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed Atom feed as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  if (!match) return "";
  let value = match[1]!.trim();
  const cdataMatch = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdataMatch) value = cdataMatch[1]!;
  return value;
}

function extractAttribute(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*?${attr}=["']([^"']*)["']`, "i");
  const match = xml.match(regex);
  return match ? match[1]! : "";
}

function extractAllBlocks(xml: string, tag: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tag}[\\s>][\\s\\S]*?<\\/${tag}>`, "gi");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[0]);
  }
  return results;
}

function extractLinkHref(xml: string, rel?: string): string {
  if (rel) {
    const regex = new RegExp(
      `<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*)["']`,
      "i"
    );
    const match = xml.match(regex);
    if (match) return match[1]!;
    // Try reverse order
    const regex2 = new RegExp(
      `<link[^>]*href=["']([^"']*?)["'][^>]*rel=["']${rel}["']`,
      "i"
    );
    const match2 = xml.match(regex2);
    if (match2) return match2[1]!;
  }
  const regex = new RegExp(`<link[^>]*href=["']([^"']*)["']`, "i");
  const match = xml.match(regex);
  return match ? match[1]! : "";
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const xml = input.input.trim();
  if (!xml.includes("<feed") && !xml.includes("<entry")) {
    throw new Error("Input does not appear to be Atom XML");
  }

  const feed: Record<string, unknown> = {
    title: extractTag(xml, "title"),
    subtitle: extractTag(xml, "subtitle") || undefined,
    id: extractTag(xml, "id"),
    updated: extractTag(xml, "updated"),
    link: extractLinkHref(xml, "alternate") || extractLinkHref(xml),
  };

  const authorName = extractTag(xml.split("<entry")[0]!, "name");
  if (authorName) {
    feed.author = {
      name: authorName,
      email: extractTag(xml.split("<entry")[0]!, "email") || undefined,
    };
  }

  const generator = extractTag(xml, "generator");
  if (generator) feed.generator = generator;

  // Clean undefined
  for (const key of Object.keys(feed)) {
    if (feed[key] === undefined) delete feed[key];
    if (typeof feed[key] === "object" && feed[key] !== null) {
      const obj = feed[key] as Record<string, unknown>;
      for (const k of Object.keys(obj)) {
        if (obj[k] === undefined) delete obj[k];
      }
    }
  }

  const entryBlocks = extractAllBlocks(xml, "entry");
  const entries: Array<Record<string, unknown>> = [];

  for (const entryXml of entryBlocks) {
    const entry: Record<string, unknown> = {
      title: extractTag(entryXml, "title"),
      id: extractTag(entryXml, "id"),
      link: extractLinkHref(entryXml, "alternate") || extractLinkHref(entryXml),
      updated: extractTag(entryXml, "updated"),
    };

    const published = extractTag(entryXml, "published");
    if (published) entry.published = published;

    const summary = extractTag(entryXml, "summary");
    if (summary) entry.summary = summary;

    const content = extractTag(entryXml, "content");
    if (content) {
      entry.content = content;
      entry.contentType =
        extractAttribute(entryXml, "content", "type") || "text";
    }

    const authorName = extractTag(entryXml, "name");
    if (authorName) {
      entry.author = { name: authorName };
    }

    const categories: string[] = [];
    const catRegex = /<category[^>]*term=["']([^"']*)["']/gi;
    let catMatch;
    while ((catMatch = catRegex.exec(entryXml)) !== null) {
      categories.push(catMatch[1]!);
    }
    if (categories.length > 0) entry.categories = categories;

    entries.push(entry);
  }

  feed.entries = entries;
  feed.entryCount = entries.length;

  return { output: JSON.stringify(feed, null, 2) };
}

export const atomParser = defineTool({
  meta: {
    id: "feeds/atom-parser",
    name: "Atom Parser",
    description:
      "Free online Atom feed parser — paste Atom XML and get structured JSON with feed metadata, entries, and authors instantly in your browser. No data is stored. Extracts titles, links, summaries, content, categories, and publication dates.",
    category: "feeds",
    subgroup: "RSS & Atom",
    tier: ToolTier.CLIENT,
    keywords: [
      "atom",
      "feed",
      "parse",
      "xml",
      "syndication",
      "json",
      "convert",
    ],
    ui: { inputLanguage: "xml", outputLanguage: "json" },
    examples: [
      {
        title: "Parse single-entry Atom feed to JSON",
        description:
          "Extract feed title, link, and entry details from an Atom 1.0 XML feed",
        input:
          '<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>My Blog</title>\n  <link href="https://example.com"/>\n  <entry>\n    <title>Hello World</title>\n    <link href="https://example.com/hello"/>\n    <updated>2024-01-15T00:00:00Z</updated>\n    <summary>First post</summary>\n  </entry>\n</feed>',
        output:
          '{"output":"{\\n  \\"title\\": \\"My Blog\\",\\n  \\"id\\": \\"\\",\\n  \\"updated\\": \\"2024-01-15T00:00:00Z\\",\\n  \\"link\\": \\"https://example.com\\",\\n  \\"entries\\": [\\n    {\\n      \\"title\\": \\"Hello World\\",\\n      \\"id\\": \\"\\",\\n      \\"link\\": \\"https://example.com/hello\\",\\n      \\"updated\\": \\"2024-01-15T00:00:00Z\\",\\n      \\"summary\\": \\"First post\\"\\n    }\\n  ],\\n  \\"entryCount\\": 1\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
