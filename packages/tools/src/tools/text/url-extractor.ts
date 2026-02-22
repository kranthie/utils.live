import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract URLs from"),
});

const outputSchema = z.object({
  urls: z.array(z.string()).describe("Extracted URLs"),
  count: z.number().describe("Number of URLs found"),
  unique: z.array(z.string()).describe("Unique URLs"),
  domains: z.array(z.string()).describe("Unique domains"),
  protocols: z.array(z.string()).describe("Protocols found"),
});

const optionsSchema = z.object({
  unique: z.boolean().default(true).describe("Return only unique URLs"),
  includeProtocolless: z
    .boolean()
    .default(true)
    .describe("Include www. URLs without protocol"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

// URL regex patterns
const URL_REGEX = /https?:\/\/[^\s<>[\]"']+/gi;
const WWW_REGEX = /www\.[^\s<>[\]"']+/gi;

function extractDomain(url: string): string {
  try {
    const normalized = url.startsWith("www.") ? `https://${url}` : url;
    const parsed = new URL(normalized);
    return parsed.hostname;
  } catch {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^/\s]+)/i);
    return match?.[1] || url;
  }
}

function extractProtocol(url: string): string {
  const match = url.match(/^(https?):\/\//i);
  return match?.[1]?.toLowerCase() || "none";
}

/**
 * Extracts URLs from text.
 */
function execute(input: Input, options?: Options): Output {
  const uniqueOnly = options?.unique ?? true;
  const includeProtocolless = options?.includeProtocolless ?? true;

  const text = input.input;
  const urlMatches = text.match(URL_REGEX) || [];
  let wwwMatches: string[] = [];

  if (includeProtocolless) {
    wwwMatches = (text.match(WWW_REGEX) || []).filter((url) => {
      // Only include if not already captured with protocol
      return !urlMatches.some((u) => u.includes(url));
    });
  }

  let urls = [...urlMatches, ...wwwMatches];

  // Clean up URLs (remove trailing punctuation)
  urls = urls.map((url) => url.replace(/[.,;:!?)\]}>]+$/, ""));

  const unique = [...new Set(urls)];
  const domains = [...new Set(unique.map(extractDomain))];
  const protocols = [...new Set(unique.map(extractProtocol))];

  if (uniqueOnly) {
    urls = unique;
  }

  return {
    urls,
    count: urls.length,
    unique,
    domains,
    protocols,
  };
}

/**
 * URL Extractor tool.
 * Extracts URLs from text.
 */
export const urlExtractor = defineTool({
  meta: {
    id: "text/url-extractor",
    name: "URL Extractor",
    description:
      "Free online URL extractor — find and extract all web links from text instantly in your browser. No data is stored. Detects HTTP/HTTPS URLs and www addresses, returns unique URLs, domains, and protocols.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["url", "extract", "link", "http", "web"],
    examples: [
      {
        title: "Extract URLs from text",
        description: "Find all web links in a paragraph",
        input:
          "Visit https://example.com or http://docs.example.com/guide for more info.",
        output:
          '{"urls":["https://example.com","http://docs.example.com/guide"],"count":2,"unique":["https://example.com","http://docs.example.com/guide"],"domains":["example.com","docs.example.com"],"protocols":["https","http"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
