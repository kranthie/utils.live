import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("RSS feed XML content"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed RSS feed as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  if (!match) return "";
  let value = match[1]!.trim();
  // Handle CDATA
  const cdataMatch = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdataMatch) value = cdataMatch[1]!;
  return value;
}

function extractAttribute(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, "i");
  const match = xml.match(regex);
  return match ? match[1]! : "";
}

function extractAllBlocks(xml: string, tag: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[0]);
  }
  return results;
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const xml = input.input.trim();
  if (!xml.includes("<rss") && !xml.includes("<channel")) {
    throw new Error("Input does not appear to be RSS XML");
  }

  const channelMatch = xml.match(/<channel[\s>][\s\S]*<\/channel>/i);
  const channel = channelMatch ? channelMatch[0] : xml;

  const feed: Record<string, unknown> = {
    title: extractTag(channel, "title"),
    link: extractTag(channel, "link"),
    description: extractTag(channel, "description"),
    language: extractTag(channel, "language") || undefined,
    lastBuildDate: extractTag(channel, "lastBuildDate") || undefined,
    pubDate: extractTag(channel, "pubDate") || undefined,
    generator: extractTag(channel, "generator") || undefined,
  };

  // Clean undefined values
  for (const key of Object.keys(feed)) {
    if (feed[key] === undefined) delete feed[key];
  }

  const itemBlocks = extractAllBlocks(channel, "item");
  const items: Array<Record<string, unknown>> = [];

  for (const itemXml of itemBlocks) {
    const item: Record<string, unknown> = {
      title: extractTag(itemXml, "title"),
      link: extractTag(itemXml, "link"),
      description: extractTag(itemXml, "description"),
    };

    const pubDate = extractTag(itemXml, "pubDate");
    if (pubDate) item.pubDate = pubDate;

    const guid = extractTag(itemXml, "guid");
    if (guid) item.guid = guid;

    const author =
      extractTag(itemXml, "author") || extractTag(itemXml, "dc:creator");
    if (author) item.author = author;

    const category = extractTag(itemXml, "category");
    if (category) item.category = category;

    const enclosureUrl = extractAttribute(itemXml, "enclosure", "url");
    if (enclosureUrl) {
      item.enclosure = {
        url: enclosureUrl,
        type: extractAttribute(itemXml, "enclosure", "type"),
        length: extractAttribute(itemXml, "enclosure", "length"),
      };
    }

    items.push(item);
  }

  feed.items = items;
  feed.itemCount = items.length;

  return { output: JSON.stringify(feed, null, 2) };
}

export const rssParser = defineTool({
  meta: {
    id: "feeds/rss-parser",
    name: "RSS Parser",
    description:
      "Free online RSS feed parser — paste RSS XML and get structured JSON with channel metadata and items instantly in your browser. No data is stored. Extracts titles, links, descriptions, authors, categories, and enclosures.",
    category: "feeds",
    subgroup: "RSS & Atom",
    tier: ToolTier.CLIENT,
    keywords: ["rss", "feed", "parse", "xml", "syndication", "json", "convert"],
    ui: { inputLanguage: "xml", outputLanguage: "json" },
    examples: [
      {
        title: "Parse single-item RSS 2.0 feed to JSON",
        description:
          "Extract channel title, link, description, and items from an RSS feed",
        input:
          '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>My Blog</title>\n    <link>https://example.com</link>\n    <description>A personal blog</description>\n    <item>\n      <title>Hello World</title>\n      <link>https://example.com/hello</link>\n      <description>My first post</description>\n    </item>\n  </channel>\n</rss>',
        output:
          '{"output":"{\\n  \\"title\\": \\"My Blog\\",\\n  \\"link\\": \\"https://example.com\\",\\n  \\"description\\": \\"A personal blog\\",\\n  \\"items\\": [\\n    {\\n      \\"title\\": \\"Hello World\\",\\n      \\"link\\": \\"https://example.com/hello\\",\\n      \\"description\\": \\"My first post\\"\\n    }\\n  ],\\n  \\"itemCount\\": 1\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
