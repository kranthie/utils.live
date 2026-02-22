import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Textile content to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Markdown content"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts Textile to Markdown.
 */
function textileToMarkdown(textile: string): string {
  let result = textile;

  // Headers: h1. Title -> # Title
  result = result.replace(/^h1\.\s+(.+)$/gm, "# $1");
  result = result.replace(/^h2\.\s+(.+)$/gm, "## $1");
  result = result.replace(/^h3\.\s+(.+)$/gm, "### $1");
  result = result.replace(/^h4\.\s+(.+)$/gm, "#### $1");
  result = result.replace(/^h5\.\s+(.+)$/gm, "##### $1");
  result = result.replace(/^h6\.\s+(.+)$/gm, "###### $1");

  // Bold: *text* -> **text**
  result = result.replace(/\*([^*\n]+)\*/g, "**$1**");

  // Italic: _text_ -> *text*
  result = result.replace(/_([^_\n]+)_/g, "*$1*");

  // Bold italic: *_text_* -> ***text***
  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, "***$1***");

  // Strikethrough: -text- -> ~~text~~
  result = result.replace(/-([^-\n]+)-/g, "~~$1~~");

  // Underline: +text+ -> <u>text</u> (no markdown equivalent)
  result = result.replace(/\+([^+\n]+)\+/g, "<u>$1</u>");

  // Superscript: ^text^ -> <sup>text</sup>
  result = result.replace(/\^([^^]+)\^/g, "<sup>$1</sup>");

  // Subscript: ~text~ -> <sub>text</sub>
  result = result.replace(/~([^~]+)~/g, "<sub>$1</sub>");

  // Inline code: @code@ -> `code`
  result = result.replace(/@([^@]+)@/g, "`$1`");

  // Links: "text":url -> [text](url)
  result = result.replace(/"([^"]+)":(\S+)/g, "[$1]($2)");

  // Images: !url! or !url(alt)! -> ![alt](url)
  result = result.replace(/!([^!(]+)\(([^)]*)\)!/g, "![$2]($1)");
  result = result.replace(/!([^!]+)!/g, "![]($1)");

  // Unordered lists: * item -> - item
  result = result.replace(/^\*\*\*\s+(.+)$/gm, "    - $1");
  result = result.replace(/^\*\*\s+(.+)$/gm, "  - $1");
  result = result.replace(/^\*\s+(.+)$/gm, "- $1");

  // Ordered lists: # item -> 1. item
  result = result.replace(/^###\s+(.+)$/gm, "    1. $1");
  result = result.replace(/^##\s+(.+)$/gm, "  1. $1");
  result = result.replace(/^#\s+(.+)$/gm, "1. $1");

  // Blockquotes: bq. text -> > text
  result = result.replace(/^bq\.\s+(.+)$/gm, "> $1");

  // Block quote with multiple paragraphs
  result = result.replace(
    /^bq\.\.\s*([\s\S]*?)^p\./gm,
    (_match: string, content: string) =>
      content
        .trim()
        .split("\n")
        .map((l: string) => "> " + l)
        .join("\n") + "\n\n"
  );

  // Preformatted/Code blocks: bc. or pre.
  result = result.replace(
    /^bc\.\s+([\s\S]*?)(?=\n\n|\n[a-z]+\.)/gm,
    "```\n$1\n```"
  );
  result = result.replace(
    /^pre\.\s+([\s\S]*?)(?=\n\n|\n[a-z]+\.)/gm,
    "```\n$1\n```"
  );

  // Horizontal rules
  result = result.replace(/^-{3,}$/gm, "---");

  // Paragraph markers: p. -> remove (Markdown doesn't need them)
  result = result.replace(/^p\.\s+/gm, "");

  // Tables
  // Textile: |_. Header |_. Header |
  //          | Cell | Cell |
  // Markdown: | Header | Header |
  //           |--------|--------|
  //           | Cell | Cell |
  const tableLines: string[] = [];
  let inTable = false;
  let headerProcessed = false;

  result.split("\n").forEach((line) => {
    if (line.startsWith("|")) {
      if (!inTable) {
        inTable = true;
        headerProcessed = false;
      }

      // Convert header cells |_. text -> | text |
      if (line.includes("|_.")) {
        const headerLine = line
          .replace(/\|_\.\s*/g, "| ")
          .replace(/\s*\|$/, " |");
        tableLines.push(headerLine);
        // Add separator line
        const cellCount = (headerLine.match(/\|/g) || []).length - 1;
        tableLines.push("|" + Array(cellCount).fill("---").join("|") + "|");
        headerProcessed = true;
      } else {
        // Regular table row
        const dataLine = line.replace(/\|\.\s*/g, "| ").replace(/\s*\|$/, " |");
        if (!headerProcessed && inTable) {
          // If we hit data without header, add empty header
          tableLines.push(dataLine);
        } else {
          tableLines.push(dataLine);
        }
      }
    } else {
      if (inTable) {
        inTable = false;
        headerProcessed = false;
      }
      tableLines.push(line);
    }
  });

  result = tableLines.join("\n");

  // Footnotes: [1] -> [^1]
  result = result.replace(/\[(\d+)\]/g, "[^$1]");
  result = result.replace(/^fn(\d+)\.\s+(.+)$/gm, "[^$1]: $2");

  // Acronyms/abbreviations: ABC(Full Name) -> ABC
  result = result.replace(/(\w+)\([^)]+\)/g, "$1");

  // CSS class/id notation: remove (class#id)
  result = result.replace(/\([^)]*#[^)]*\)/g, "");
  result = result.replace(/\([^)]*\)/g, "");

  // Alignment modifiers: remove
  result = result.replace(/<>/g, "");
  result = result.replace(/<(?=[^a-z])/g, "");
  result = result.replace(/>(?=[^a-z])/g, "");

  // Clean up extra blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * Converts Textile to Markdown.
 */
function execute(input: Input): Output {
  const output = textileToMarkdown(input.input);
  return { output };
}

/**
 * Textile to Markdown converter tool.
 * Converts Textile format to Markdown.
 */
export const textileToMd = defineTool({
  meta: {
    id: "markdown/textile-to-md",
    name: "Textile to Markdown",
    description:
      "Free online Textile to Markdown converter — transform Textile headers, bold, italic, strikethrough, links, lists, blockquotes, and tables to Markdown instantly in your browser. No data is stored. Supports footnotes, code blocks, and nested list levels.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "textile", "convert", "redmine"],
    examples: [
      {
        title: "Convert Textile to Markdown",
        description: "Transform Textile markup to Markdown",
        input:
          "h2. Features\n\n*Bold* and _italic_ text.\n\n* Item 1\n* Item 2",
        output:
          "1. Features\n\n**Bold** and *italic* text.\n\n- Item 1\n- Item 2",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
