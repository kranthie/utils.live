import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown string to convert to plain text"),
});

const outputSchema = z.object({
  output: z.string().describe("Plain text without markdown formatting"),
  charCount: z.number().describe("Character count of plain text"),
  wordCount: z.number().describe("Word count of plain text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Strips markdown formatting from text to produce plain text.
 */
function stripMarkdown(markdown: string): string {
  let text = markdown;

  // Remove frontmatter (YAML between --- markers)
  text = text.replace(/^---[\s\S]*?---\n?/m, "");

  // Remove code blocks (fenced)
  text = text.replace(/```[\s\S]*?```/g, "");

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove images (keep alt text)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Remove links (keep link text)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove reference-style links
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");

  // Remove link definitions
  text = text.replace(/^\s*\[[^\]]+\]:\s+.+$/gm, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Remove headers (keep text)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "$1");

  // Remove setext-style headers (underlines)
  text = text.replace(/^[=-]+$/gm, "");

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, "");

  // Remove blockquotes (keep text)
  text = text.replace(/^\s*>\s?/gm, "");

  // Remove bold/italic with asterisks (order matters - do bold first)
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");

  // Remove bold/italic with underscores
  text = text.replace(/___([^_]+)___/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Remove list markers (unordered)
  text = text.replace(/^\s*[-*+]\s+/gm, "");

  // Remove list markers (ordered)
  text = text.replace(/^\s*\d+\.\s+/gm, "");

  // Remove task list markers
  text = text.replace(/^\s*\[[ xX]\]\s*/gm, "");

  // Remove table separators
  text = text.replace(/^\|?[\s:|-]+\|?$/gm, "");

  // Remove table pipes, keeping content
  text = text.replace(/\|/g, " ");

  // Remove footnotes
  text = text.replace(/\[\^[^\]]+\]/g, "");
  text = text.replace(/^\[\^[^\]]+\]:.+$/gm, "");

  // Remove highlight markers
  text = text.replace(/==([^=]+)==/g, "$1");

  // Remove subscript/superscript (if using common notation)
  text = text.replace(/~([^~]+)~/g, "$1");
  text = text.replace(/\^([^^]+)\^/g, "$1");

  // Normalize whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/[ \t]+/g, " ");

  // Trim lines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  return text.trim();
}

/**
 * Counts words in text.
 */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Converts markdown to plain text.
 */
function execute(input: Input): Output {
  const output = stripMarkdown(input.input);

  return {
    output,
    charCount: output.length,
    wordCount: countWords(output),
  };
}

/**
 * Markdown to Plain Text tool.
 * Strips markdown formatting to get plain text.
 */
export const markdownToPlainText = defineTool({
  meta: {
    id: "markdown/to-plain-text",
    name: "Markdown to Plain Text",
    description:
      "Free online Markdown to plain text converter — strip all Markdown formatting including headers, bold, italic, links, images, code blocks, lists, and tables to get clean plain text instantly in your browser. No data is stored. Reports character and word counts.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "plain", "text", "strip", "remove", "format", "md"],
    examples: [
      {
        title: "Strip markdown formatting",
        description: "Convert markdown to plain text",
        input:
          "# Hello World\n\nThis is **bold** and *italic* text with a [link](https://example.com).",
        output: "Hello World\n\nThis is bold and italic text with a link.",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
