import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("AsciiDoc content to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Markdown content"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts AsciiDoc to Markdown.
 */
function asciidocToMarkdown(asciidoc: string): string {
  let result = asciidoc;

  // Document title: = Title -> # Title
  result = result.replace(/^= (.+)$/gm, "# $1");
  // Section headers
  result = result.replace(/^====== (.+)$/gm, "###### $1");
  result = result.replace(/^===== (.+)$/gm, "##### $1");
  result = result.replace(/^==== (.+)$/gm, "#### $1");
  result = result.replace(/^=== (.+)$/gm, "### $1");
  result = result.replace(/^== (.+)$/gm, "## $1");

  // Bold: *text* -> **text** (AsciiDoc uses single * for bold when constrained)
  // Unconstrained bold: **text** stays **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, "**$1**");
  result = result.replace(/(?<!\*)\*([^*\s][^*]*[^*\s])\*(?!\*)/g, "**$1**");

  // Italic: _text_ -> *text*
  result = result.replace(/__([^_]+)__/g, "*$1*");
  result = result.replace(/(?<!_)_([^_\s][^_]*[^_\s])_(?!_)/g, "*$1*");

  // Monospace: `text` -> `text` (same)
  // +text+ -> `text` (old AsciiDoc)
  result = result.replace(/\+([^+]+)\+/g, "`$1`");

  // Inline code: `code` stays the same
  // Backtick literal: `` -> `
  result = result.replace(/``/g, "`");

  // Subscript: ~text~ -> <sub>text</sub>
  result = result.replace(/~([^~]+)~/g, "<sub>$1</sub>");

  // Superscript: ^text^ -> <sup>text</sup>
  result = result.replace(/\^([^^]+)\^/g, "<sup>$1</sup>");

  // Links: https://example.com[text] -> [text](https://example.com)
  result = result.replace(/(https?:\/\/[^[\s]+)\[([^\]]*)\]/g, "[$2]($1)");

  // Links: link:url[text] -> [text](url)
  result = result.replace(/link:([^[]+)\[([^\]]*)\]/g, "[$2]($1)");

  // Bare links without text
  result = result.replace(/(https?:\/\/[^[\s]+)(?!\[)/g, "<$1>");

  // Images: image:path[alt] -> ![alt](path)
  result = result.replace(/image::?([^[]+)\[([^\]]*)\]/g, "![$2]($1)");

  // Unordered lists: * item -> - item (AsciiDoc uses * for lists)
  result = result.replace(/^(\*+) /gm, (_match: string, stars: string) => {
    const level = stars.length;
    const indentStr = "  ".repeat(level - 1);
    return `${indentStr}- `;
  });

  // Ordered lists: . item -> 1. item
  result = result.replace(/^(\.+) /gm, (_match: string, dots: string) => {
    const level = dots.length;
    const indentStr = "  ".repeat(level - 1);
    return `${indentStr}1. `;
  });

  // Checklists: [*] or [x] checked, [ ] unchecked
  result = result.replace(/^\s*\[\*\]/gm, "- [x]");
  result = result.replace(/^\s*\[x\]/gim, "- [x]");
  result = result.replace(/^\s*\[ \]/gm, "- [ ]");

  // Code blocks
  // ---- or ==== source blocks
  result = result.replace(
    /\[source,?\s*(\w*)\]\s*\n----\n([\s\S]*?)----/g,
    (_match: string, lang: string, code: string) =>
      "```" + (lang || "") + "\n" + code.trim() + "\n```"
  );

  // Literal blocks with ....
  result = result.replace(
    /\.\.\.\.\n([\s\S]*?)\.\.\.\./g,
    (_match: string, code: string) => "```\n" + code.trim() + "\n```"
  );

  // Admonition blocks: NOTE:, TIP:, WARNING:, IMPORTANT:, CAUTION:
  result = result.replace(/^NOTE:\s*(.+)$/gm, "> **Note:** $1");
  result = result.replace(/^TIP:\s*(.+)$/gm, "> **Tip:** $1");
  result = result.replace(/^WARNING:\s*(.+)$/gm, "> **Warning:** $1");
  result = result.replace(/^IMPORTANT:\s*(.+)$/gm, "> **Important:** $1");
  result = result.replace(/^CAUTION:\s*(.+)$/gm, "> **Caution:** $1");

  // Block admonitions
  result = result.replace(
    /\[(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*\n====([\s\S]*?)====/g,
    (_match: string, type: string, content: string) =>
      `> **${type.charAt(0) + type.slice(1).toLowerCase()}:** ${content.trim()}`
  );

  // Horizontal rules
  result = result.replace(/^'{3,}$/gm, "---");
  result = result.replace(/^-{3,}$/gm, "---");

  // Quote blocks
  result = result.replace(
    /\[quote,?\s*([^\]]*)\]\s*\n____\n([\s\S]*?)____/g,
    (_match: string, attribution: string, text: string) => {
      const quoted = text
        .trim()
        .split("\n")
        .map((l: string) => "> " + l)
        .join("\n");
      return attribution ? `${quoted}\n> - ${attribution}` : quoted;
    }
  );

  // Simple blockquotes
  result = result.replace(
    /^____\n([\s\S]*?)____$/gm,
    (_match: string, text: string) =>
      text
        .trim()
        .split("\n")
        .map((l: string) => "> " + l)
        .join("\n")
  );

  // Definition lists (simplified)
  result = result.replace(/^(\S.+)::$/gm, "**$1**");

  // Attributes/variables: :attr: value
  result = result.replace(/^:([^:]+):\s*(.+)$/gm, "<!-- $1: $2 -->");

  // Include directives (comment out)
  result = result.replace(/^include::(.+)\[\]$/gm, "<!-- include: $1 -->");

  // Remove passthrough blocks
  result = result.replace(/\+\+\+\+\n[\s\S]*?\+\+\+\+/g, "");

  // Tables (basic conversion)
  result = result.replace(/^\|===$/gm, "");
  result = result.replace(/^\|(.+)\|$/gm, "|$1|");

  // Clean up extra blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * Converts AsciiDoc to Markdown.
 */
function execute(input: Input): Output {
  const output = asciidocToMarkdown(input.input);
  return { output };
}

/**
 * AsciiDoc to Markdown converter tool.
 * Converts AsciiDoc format to Markdown.
 */
export const asciidocToMd = defineTool({
  meta: {
    id: "markdown/asciidoc-to-md",
    name: "AsciiDoc to Markdown",
    description:
      "Free online AsciiDoc to Markdown converter — transform AsciiDoc headers, formatting, links, lists, and code blocks to Markdown instantly in your browser. No data is stored. Supports admonitions, blockquotes, tables, and definition lists.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "asciidoc", "adoc", "convert"],
    examples: [
      {
        title: "Convert AsciiDoc to Markdown",
        description: "Transform AsciiDoc headers and formatting to Markdown",
        input:
          "== Introduction\n\nThis is *bold* and _italic_ text.\n\n=== Details\n\nSee https://example.com[our docs].",
        output:
          "## Introduction\n\nThis is **bold** and *italic* text.\n\n### Details\n\nSee [our docs](<https://example.com).>",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
