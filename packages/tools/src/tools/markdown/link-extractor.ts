import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown content to extract links from"),
});

const linkSchema = z.object({
  url: z.string().describe("Link URL"),
  text: z.string().describe("Link text"),
  title: z.string().nullable().describe("Link title (if present)"),
});

const outputSchema = z.object({
  links: z.array(linkSchema).describe("Array of extracted links"),
  count: z.number().describe("Total number of links found"),
  uniqueUrls: z.array(z.string()).describe("Unique URLs"),
  uniqueDomains: z.array(z.string()).describe("Unique domains"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface Link {
  url: string;
  text: string;
  title: string | null;
}

/**
 * Extract domain from URL.
 */
function extractDomain(url: string): string | null {
  try {
    // Handle relative URLs
    if (url.startsWith("/") || url.startsWith("#") || url.startsWith("./")) {
      return null;
    }
    // Handle URLs without protocol
    const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(urlWithProtocol);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Extract all links from markdown content.
 */
function extractLinks(markdown: string): Link[] {
  const links: Link[] = [];

  // Match inline links: [text](url) or [text](url "title")
  const inlineLinkRegex = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  let match;

  while ((match = inlineLinkRegex.exec(markdown)) !== null) {
    links.push({
      text: match[1] ?? "",
      url: match[2] ?? "",
      title: match[3] ?? null,
    });
  }

  // Match reference links: [text][ref] with [ref]: url "title"
  const refLinkRegex = /\[([^\]]+)\]\[([^\]]*)\]/g;
  const refDefRegex = /^\[([^\]]+)\]:\s*(\S+)(?:\s+"([^"]*)")?/gm;

  // Build reference definitions map
  const refDefs = new Map<string, { url: string; title: string | null }>();
  while ((match = refDefRegex.exec(markdown)) !== null) {
    const refKey = match[1];
    const refUrl = match[2];
    if (refKey && refUrl) {
      refDefs.set(refKey.toLowerCase(), {
        url: refUrl,
        title: match[3] ?? null,
      });
    }
  }

  // Match reference links and resolve them
  while ((match = refLinkRegex.exec(markdown)) !== null) {
    const text = match[1] ?? "";
    const refText = match[2] || match[1];
    if (refText) {
      const ref = refText.toLowerCase();
      const def = refDefs.get(ref);
      if (def) {
        links.push({
          text,
          url: def.url,
          title: def.title,
        });
      }
    }
  }

  // Match autolinks: <url>
  const autolinkRegex = /<(https?:\/\/[^>]+)>/g;
  while ((match = autolinkRegex.exec(markdown)) !== null) {
    const autoUrl = match[1] ?? "";
    links.push({
      text: autoUrl,
      url: autoUrl,
      title: null,
    });
  }

  return links;
}

/**
 * Extracts all links from Markdown content.
 */
function execute(input: Input): Output {
  const links = extractLinks(input.input);

  const urls = links.map((l) => l.url);
  const uniqueUrls = [...new Set(urls)];

  const domains = links
    .map((l) => extractDomain(l.url))
    .filter((d): d is string => d !== null);
  const uniqueDomains = [...new Set(domains)];

  return {
    links,
    count: links.length,
    uniqueUrls,
    uniqueDomains,
  };
}

/**
 * Markdown Link Extractor tool.
 * Extracts all links from Markdown content.
 */
export const markdownLinkExtractor = defineTool({
  meta: {
    id: "markdown/link-extractor",
    name: "Markdown Link Extractor",
    description:
      "Free online Markdown link extractor — find and list all hyperlinks including inline links, reference links, and autolinks from Markdown documents instantly in your browser. No data is stored. Reports link text, URLs, unique URLs, and unique domains.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "link", "extract", "url", "href"],
    examples: [
      {
        title: "Extract links from Markdown",
        description: "Find all hyperlinks in a Markdown document",
        input:
          "Check [our docs](https://docs.example.com) and [GitHub](https://github.com/org/repo).",
        output:
          '{\n  "links": [\n    {\n      "text": "our docs",\n      "url": "https://docs.example.com",\n      "title": null\n    },\n    {\n      "text": "GitHub",\n      "url": "https://github.com/org/repo",\n      "title": null\n    }\n  ],\n  "count": 2,\n  "uniqueUrls": [\n    "https://docs.example.com",\n    "https://github.com/org/repo"\n  ],\n  "uniqueDomains": [\n    "docs.example.com",\n    "github.com"\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
