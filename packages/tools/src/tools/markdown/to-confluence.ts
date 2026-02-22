import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown text to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Confluence wiki markup"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts Markdown to Confluence wiki markup.
 */
function convertMarkdownToConfluence(markdown: string): string {
  let result = markdown;

  // Headers
  result = result.replace(/^###### (.+)$/gm, "h6. $1");
  result = result.replace(/^##### (.+)$/gm, "h5. $1");
  result = result.replace(/^#### (.+)$/gm, "h4. $1");
  result = result.replace(/^### (.+)$/gm, "h3. $1");
  result = result.replace(/^## (.+)$/gm, "h2. $1");
  result = result.replace(/^# (.+)$/gm, "h1. $1");

  // Bold and italic (order matters)
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, "*_$1_*"); // Bold italic
  result = result.replace(/\*\*(.+?)\*\*/g, "*$1*"); // Bold
  result = result.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "_$1_"); // Italic
  result = result.replace(/__(.+?)__/g, "*$1*"); // Bold (alternate)
  result = result.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, "_$1_"); // Italic (alternate)

  // Strikethrough
  result = result.replace(/~~(.+?)~~/g, "-$1-");

  // Inline code
  result = result.replace(/`([^`]+)`/g, "{{$1}}");

  // Code blocks
  result = result.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match: string, lang: string, code: string) =>
      `{code:language=${lang || "none"}}\n${code.trim()}\n{code}`
  );

  // Blockquotes
  result = result.replace(/^> (.+)$/gm, "{quote}$1{quote}");
  // Multi-line blockquotes
  result = result.replace(
    /^(> .+\n)+/gm,
    (match) =>
      "{quote}\n" +
      match
        .split("\n")
        .map((l) => l.replace(/^> /, ""))
        .join("\n") +
      "{quote}\n"
  );

  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "[$1|$2]");

  // Images
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "!$2|alt=$1!");

  // Unordered lists
  result = result.replace(
    /^(\s*)[-*+] (.+)$/gm,
    (_match: string, indent: string, content: string) => {
      const level = Math.floor(indent.length / 2) + 1;
      return "*".repeat(level) + " " + content;
    }
  );

  // Ordered lists
  result = result.replace(
    /^(\s*)\d+\. (.+)$/gm,
    (_match: string, indent: string, content: string) => {
      const level = Math.floor(indent.length / 2) + 1;
      return "#".repeat(level) + " " + content;
    }
  );

  // Horizontal rules
  result = result.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, "----");

  // Tables - basic conversion
  result = result.replace(/^\|(.+)\|$/gm, (match) => {
    // Check if this is a separator row
    if (/^\|[\s\-:]+\|$/.test(match)) {
      return ""; // Remove separator rows
    }
    // Convert pipes for data/header rows
    return match
      .replace(/\|/g, "||")
      .replace(/^\|\|/, "||")
      .replace(/\|\|$/, "||");
  });

  // Clean up empty lines from table separator removal
  result = result.replace(/\n{3,}/g, "\n\n");

  // Task lists
  result = result.replace(/^- \[x\] (.+)$/gm, "(/) $1");
  result = result.replace(/^- \[ \] (.+)$/gm, "(x) $1");

  return result.trim();
}

/**
 * Converts markdown to Confluence wiki format.
 */
function execute(input: Input): Output {
  const output = convertMarkdownToConfluence(input.input);
  return { output };
}

/**
 * Markdown to Confluence Converter tool.
 * Converts Markdown to Confluence wiki markup.
 */
export const markdownToConfluence = defineTool({
  meta: {
    id: "markdown/to-confluence",
    name: "Markdown to Confluence",
    description:
      "Free online Markdown to Confluence converter — transform Markdown headings, bold, italic, code blocks, links, lists, and tables to Confluence wiki markup instantly in your browser. No data is stored. Supports task lists, strikethrough, horizontal rules, and images.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "confluence", "wiki", "atlassian", "convert"],
    examples: [
      {
        title: "Convert Markdown to Confluence",
        description: "Transform Markdown to Confluence wiki markup",
        input:
          "## Features\n\n**Bold** and *italic* text.\n\n- Item 1\n- Item 2",
        output: "h2. Features\n\n_Bold_ and _italic_ text.\n* Item 1\n* Item 2",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
