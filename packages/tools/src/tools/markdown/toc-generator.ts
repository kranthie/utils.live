import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown content to extract headings from"),
});

const headingSchema = z.object({
  level: z.number().describe("Heading level (1-6)"),
  text: z.string().describe("Heading text"),
  slug: z.string().describe("URL-friendly slug for linking"),
});

const outputSchema = z.object({
  toc: z.string().describe("Generated table of contents in Markdown format"),
  headings: z.array(headingSchema).describe("Array of extracted headings"),
});

const optionsSchema = z.object({
  maxDepth: z
    .number()
    .min(1)
    .max(6)
    .default(6)
    .describe("Maximum heading depth to include (1-6)"),
  ordered: z
    .boolean()
    .default(false)
    .describe("Use ordered list (1. 2. 3.) instead of bullets"),
  linkPrefix: z
    .string()
    .default("")
    .describe("Prefix to prepend to anchor links"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface Heading {
  level: number;
  text: string;
  slug: string;
}

/**
 * Generate a URL-friendly slug from heading text.
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}

/**
 * Extract headings from markdown content.
 */
function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    // Track code blocks
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip lines inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Match ATX-style headings (# Heading)
    const match = line.match(/^(#{1,6})\s+(.+?)(?:\s*#*)?$/);
    if (match) {
      const hashes = match[1];
      const headingText = match[2];
      if (hashes && headingText) {
        const level = hashes.length;
        // Remove inline code, links, and formatting from heading text for slug
        const text = headingText
          .replace(/`[^`]+`/g, "") // Remove inline code
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace links with text
          .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
          .replace(/\*([^*]+)\*/g, "$1") // Remove italic
          .replace(/_([^_]+)_/g, "$1") // Remove underscore italic
          .replace(/~~([^~]+)~~/g, "$1") // Remove strikethrough
          .trim();

        headings.push({
          level,
          text: headingText.trim(),
          slug: generateSlug(text),
        });
      }
    }
  }

  return headings;
}

/**
 * Generate table of contents from headings.
 */
function generateToc(
  headings: Heading[],
  maxDepth: number,
  ordered: boolean,
  linkPrefix: string
): string {
  const filteredHeadings = headings.filter((h) => h.level <= maxDepth);

  if (filteredHeadings.length === 0) {
    return "";
  }

  // Find minimum heading level to use as base
  const minLevel = Math.min(...filteredHeadings.map((h) => h.level));

  const lines: string[] = [];

  for (let i = 0; i < filteredHeadings.length; i++) {
    const heading = filteredHeadings[i];
    if (heading) {
      const indent = "  ".repeat(heading.level - minLevel);
      const marker = ordered ? `${i + 1}.` : "-";
      const link = `${linkPrefix}#${heading.slug}`;
      lines.push(`${indent}${marker} [${heading.text}](${link})`);
    }
  }

  return lines.join("\n");
}

/**
 * Generates a table of contents from Markdown headings.
 */
function execute(input: Input, options?: Options): Output {
  const maxDepth = options?.maxDepth ?? 6;
  const ordered = options?.ordered ?? false;
  const linkPrefix = options?.linkPrefix ?? "";

  const headings = extractHeadings(input.input);
  const toc = generateToc(headings, maxDepth, ordered, linkPrefix);

  return {
    toc,
    headings: headings.filter((h) => h.level <= maxDepth),
  };
}

/**
 * Markdown TOC Generator tool.
 * Generates a table of contents from Markdown headings.
 */
export const markdownTocGenerator = defineTool({
  meta: {
    id: "markdown/toc-generator",
    name: "Markdown TOC Generator",
    description:
      "Free online Markdown TOC generator — generate a table of contents with anchor links from Markdown headings instantly in your browser. No data is stored. Supports configurable max depth, ordered/unordered lists, and link prefixes for nested documents.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "toc", "table of contents", "headings", "outline"],
    examples: [
      {
        title: "Generate table of contents",
        description: "Create a TOC from Markdown headings",
        input:
          "# Introduction\n\n## Getting Started\n\n### Installation\n\n## Usage",
        output:
          '{\n  "toc": "- [Introduction](#introduction)\\n  - [Getting Started](#getting-started)\\n    - [Installation](#installation)\\n  - [Usage](#usage)",\n  "headings": [\n    {\n      "level": 1,\n      "text": "Introduction",\n      "slug": "introduction"\n    },\n    {\n      "level": 2,\n      "text": "Getting Started",\n      "slug": "getting-started"\n    },\n    {\n      "level": 3,\n      "text": "Installation",\n      "slug": "installation"\n    },\n    {\n      "level": 2,\n      "text": "Usage",\n      "slug": "usage"\n    }\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
