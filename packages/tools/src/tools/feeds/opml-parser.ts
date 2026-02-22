import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OPML subscription list XML"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed OPML as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1]!.trim() : "";
}

interface Outline {
  text: string;
  title?: string;
  type?: string;
  xmlUrl?: string;
  htmlUrl?: string;
  children?: Outline[];
}

function parseOutlines(xml: string): Outline[] {
  const outlines: Outline[] = [];
  const outlineRegex = /<outline\s([^>]*?)(?:\/>|>([\s\S]*?)<\/outline>)/gi;
  let match;

  while ((match = outlineRegex.exec(xml)) !== null) {
    const attrs = match[1]!;
    const innerContent = match[2] ?? "";

    const outline: Outline = {
      text: extractAttr(attrs, "text") || extractAttr(attrs, "title") || "",
    };

    const title = extractAttr(attrs, "title");
    if (title && title !== outline.text) outline.title = title;

    const type = extractAttr(attrs, "type");
    if (type) outline.type = type;

    const xmlUrl = extractAttr(attrs, "xmlUrl");
    if (xmlUrl) outline.xmlUrl = xmlUrl;

    const htmlUrl = extractAttr(attrs, "htmlUrl");
    if (htmlUrl) outline.htmlUrl = htmlUrl;

    if (innerContent.trim() && innerContent.includes("<outline")) {
      outline.children = parseOutlines(innerContent);
    }

    outlines.push(outline);
  }

  return outlines;
}

function extractAttr(attrs: string, name: string): string {
  const regex = new RegExp(`${name}=["']([^"']*)["']`, "i");
  const match = attrs.match(regex);
  return match ? match[1]! : "";
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const xml = input.input.trim();
  if (!xml.includes("<opml") && !xml.includes("<outline")) {
    throw new Error("Input does not appear to be OPML XML");
  }

  const result: Record<string, unknown> = {};

  // Parse head
  const head = xml.match(/<head[\s>][\s\S]*?<\/head>/i)?.[0];
  if (head) {
    const title = extractTag(head, "title");
    if (title) result.title = title;
    const dateCreated = extractTag(head, "dateCreated");
    if (dateCreated) result.dateCreated = dateCreated;
    const dateModified = extractTag(head, "dateModified");
    if (dateModified) result.dateModified = dateModified;
    const ownerName = extractTag(head, "ownerName");
    if (ownerName) result.ownerName = ownerName;
  }

  // Parse body
  const body = xml.match(/<body[\s>][\s\S]*?<\/body>/i)?.[0];
  if (body) {
    result.outlines = parseOutlines(body);
  } else {
    result.outlines = parseOutlines(xml);
  }

  // Flatten feed list
  const feeds: Array<Record<string, string>> = [];
  function flattenFeeds(outlines: Outline[], folder: string = ""): void {
    for (const outline of outlines) {
      if (outline.xmlUrl) {
        const feed: Record<string, string> = {
          text: outline.text,
          xmlUrl: outline.xmlUrl,
        };
        if (outline.htmlUrl) feed.htmlUrl = outline.htmlUrl;
        if (outline.type) feed.type = outline.type;
        if (folder) feed.folder = folder;
        feeds.push(feed);
      }
      if (outline.children) {
        flattenFeeds(outline.children, outline.text);
      }
    }
  }

  flattenFeeds(result.outlines as Outline[]);
  result.feeds = feeds;
  result.feedCount = feeds.length;

  return { output: JSON.stringify(result, null, 2) };
}

export const opmlParser = defineTool({
  meta: {
    id: "feeds/opml-parser",
    name: "OPML Parser",
    description:
      "Free online OPML parser — paste OPML subscription XML and get a structured JSON list of feeds with folders instantly in your browser. No data is stored. Extracts feed URLs, titles, types, and folder hierarchy.",
    category: "feeds",
    subgroup: "RSS & Atom",
    tier: ToolTier.CLIENT,
    keywords: [
      "opml",
      "subscription",
      "feed",
      "rss",
      "parse",
      "import",
      "export",
    ],
    ui: { inputLanguage: "xml", outputLanguage: "json" },
    examples: [
      {
        title: "Parse OPML feed subscription list",
        description:
          "Extract feed URLs and metadata from an OPML 2.0 subscription file",
        input:
          '<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head><title>My Feeds</title></head>\n  <body>\n    <outline text="Tech" type="rss" xmlUrl="https://example.com/feed.xml" htmlUrl="https://example.com"/>\n  </body>\n</opml>',
        output:
          '{"output":"{\\n  \\"title\\": \\"My Feeds\\",\\n  \\"outlines\\": [\\n    {\\n      \\"text\\": \\"Tech\\",\\n      \\"type\\": \\"rss\\",\\n      \\"xmlUrl\\": \\"https://example.com/feed.xml\\",\\n      \\"htmlUrl\\": \\"https://example.com\\"\\n    }\\n  ],\\n  \\"feeds\\": [\\n    {\\n      \\"text\\": \\"Tech\\",\\n      \\"xmlUrl\\": \\"https://example.com/feed.xml\\",\\n      \\"htmlUrl\\": \\"https://example.com\\",\\n      \\"type\\": \\"rss\\"\\n    }\\n  ],\\n  \\"feedCount\\": 1\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
