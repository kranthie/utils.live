import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown text to check for links"),
});

const outputSchema = z.object({
  totalLinks: z.number().describe("Total number of links found"),
  links: z
    .array(
      z.object({
        text: z.string(),
        url: z.string(),
        line: z.number(),
        type: z.enum(["url", "anchor", "relative", "email", "unknown"]),
        valid: z.boolean(),
        issue: z.string().optional(),
      })
    )
    .describe("List of links with validation status"),
  summary: z.object({
    urls: z.number(),
    anchors: z.number(),
    relative: z.number(),
    emails: z.number(),
    valid: z.number(),
    invalid: z.number(),
  }),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface LinkInfo {
  text: string;
  url: string;
  line: number;
  type: "url" | "anchor" | "relative" | "email" | "unknown";
  valid: boolean;
  issue?: string | undefined;
}

/**
 * Determines the type of link based on URL pattern.
 */
function getLinkType(
  url: string
): "url" | "anchor" | "relative" | "email" | "unknown" {
  if (url.startsWith("#")) return "anchor";
  if (url.startsWith("mailto:") || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(url))
    return "email";
  if (/^https?:\/\//.test(url)) return "url";
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../"))
    return "relative";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return "url";
  return "relative";
}

/**
 * Validates a link URL for common issues.
 */
function validateLink(url: string): { valid: boolean; issue?: string } {
  // Empty URL
  if (!url || url.trim() === "") {
    return { valid: false, issue: "Empty URL" };
  }

  // Check for unresolved template variables
  if (/\{\{.*?\}\}|\$\{.*?\}/.test(url)) {
    return { valid: false, issue: "Unresolved template variable" };
  }

  // Check for spaces (should be encoded)
  if (url.includes(" ") && !url.startsWith("mailto:")) {
    return { valid: false, issue: "URL contains unencoded spaces" };
  }

  // Check for http:// (should prefer https://)
  if (url.startsWith("http://") && !url.includes("localhost")) {
    return { valid: true, issue: "Consider using HTTPS instead of HTTP" };
  }

  // Validate URL structure for external links
  if (/^https?:\/\//.test(url)) {
    try {
      new URL(url);
    } catch {
      return { valid: false, issue: "Invalid URL format" };
    }
  }

  return { valid: true };
}

/**
 * Extracts and validates all links from markdown content.
 */
function checkLinks(input: string): Output {
  const links: LinkInfo[] = [];
  const lines = input.split("\n");

  // Match markdown links: [text](url) and reference links
  const linkPattern = /\[([^\]]*)\]\(([^)]*)\)/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = linkPattern.exec(line)) !== null) {
      const text = match[1] || "";
      const url = match[2] || "";
      const type = getLinkType(url);
      const validation = validateLink(url);

      links.push({
        text,
        url,
        line: index + 1,
        type,
        valid: validation.valid,
        issue: validation.issue,
      });
    }
  });

  // Also check for bare URLs
  const bareUrlPattern = /(?<!\]\()(?<!\()(?:https?:\/\/[^\s<>[\]]+)(?!\))/g;
  lines.forEach((line, index) => {
    let match;
    while ((match = bareUrlPattern.exec(line)) !== null) {
      const url = match[0];
      // Skip if this URL is already captured as part of a markdown link
      if (!links.some((l) => l.line === index + 1 && l.url === url)) {
        links.push({
          text: "(bare URL)",
          url,
          line: index + 1,
          type: "url",
          valid: true,
          issue: "Consider wrapping in markdown link syntax",
        });
      }
    }
  });

  // Calculate summary
  const summary = {
    urls: links.filter((l) => l.type === "url").length,
    anchors: links.filter((l) => l.type === "anchor").length,
    relative: links.filter((l) => l.type === "relative").length,
    emails: links.filter((l) => l.type === "email").length,
    valid: links.filter((l) => l.valid).length,
    invalid: links.filter((l) => !l.valid).length,
  };

  return {
    totalLinks: links.length,
    links,
    summary,
  };
}

/**
 * Checks markdown for link issues.
 */
function execute(input: Input): Output {
  return checkLinks(input.input);
}

/**
 * Markdown Link Checker tool.
 * Validates links in markdown content.
 */
export const markdownLinkChecker = defineTool({
  meta: {
    id: "markdown/link-checker",
    name: "Markdown Link Checker",
    description:
      "Free online Markdown link checker — validate all links in Markdown documents for common issues like empty URLs, unresolved template variables, and unencoded spaces instantly in your browser. No data is stored. Categorizes links by type (URL, anchor, relative, email) and reports validation summary.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "link", "url", "check", "validate"],
    examples: [
      {
        title: "Check links in Markdown",
        description: "Validate and list all links in a Markdown document",
        input:
          "See [Google](https://google.com) and [Docs](./docs/readme.md).\n\n![logo](images/logo.png)",
        output:
          '{\n  "totalLinks": 3,\n  "links": [\n    {\n      "text": "Google",\n      "url": "https://google.com",\n      "line": 1,\n      "type": "url",\n      "valid": true\n    },\n    {\n      "text": "Docs",\n      "url": "./docs/readme.md",\n      "line": 1,\n      "type": "relative",\n      "valid": true\n    },\n    {\n      "text": "logo",\n      "url": "images/logo.png",\n      "line": 3,\n      "type": "relative",\n      "valid": true\n    }\n  ],\n  "summary": {\n    "urls": 1,\n    "anchors": 0,\n    "relative": 2,\n    "emails": 0,\n    "valid": 3,\n    "invalid": 0\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
