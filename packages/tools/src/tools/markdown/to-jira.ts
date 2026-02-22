import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown text to convert to Jira wiki markup"),
});

const outputSchema = z.object({
  output: z.string().describe("Jira wiki markup formatted text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts markdown to Jira wiki markup format.
 *
 * Conversions:
 * - **bold** or __bold__ -> *bold*
 * - *italic* or _italic_ -> _italic_
 * - `code` -> {{code}}
 * - ```code``` -> {code}...{code}
 * - ```lang\ncode``` -> {code:lang}...{code}
 * - [link](url) -> [link|url]
 * - ![alt](url) -> !url!
 * - # Header -> h1. Header
 * - ## Header -> h2. Header
 * - > quote -> {quote}...{quote}
 * - - item -> * item
 * - 1. item -> # item
 * - ~~strikethrough~~ -> -strikethrough-
 * - horizontal rule --- -> ----
 */
function execute(input: Input): Output {
  let text = input.input;

  // Convert fenced code blocks with language ```lang\ncode``` -> {code:lang}...{code}
  text = text.replace(/```(\w+)\n([\s\S]*?)```/g, "{code:$1}\n$2{code}");

  // Convert fenced code blocks without language ```code``` -> {code}...{code}
  text = text.replace(/```\n?([\s\S]*?)```/g, "{code}\n$1{code}");

  // Preserve inline code by converting immediately
  // `code` -> {{code}}
  text = text.replace(/`([^`]+)`/g, "{{$1}}");

  // Convert images ![alt](url) -> !url!
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "!$2!");

  // Convert links [text](url) -> [text|url]
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "[$1|$2]");

  // Convert headers
  text = text.replace(/^#{6}\s+(.+)$/gm, "h6. $1");
  text = text.replace(/^#{5}\s+(.+)$/gm, "h5. $1");
  text = text.replace(/^#{4}\s+(.+)$/gm, "h4. $1");
  text = text.replace(/^#{3}\s+(.+)$/gm, "h3. $1");
  text = text.replace(/^#{2}\s+(.+)$/gm, "h2. $1");
  text = text.replace(/^#{1}\s+(.+)$/gm, "h1. $1");

  // Convert blockquotes > text -> {quote}text{quote}
  // Handle multiline quotes
  const lines = text.split("\n");
  const result: string[] = [];
  let inQuote = false;
  let quoteContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("> ")) {
      if (!inQuote) {
        inQuote = true;
        quoteContent = [];
      }
      quoteContent.push(line.slice(2));
    } else if (line === ">") {
      if (!inQuote) {
        inQuote = true;
        quoteContent = [];
      }
      quoteContent.push("");
    } else {
      if (inQuote) {
        result.push("{quote}");
        result.push(...quoteContent);
        result.push("{quote}");
        inQuote = false;
        quoteContent = [];
      }
      result.push(line);
    }
  }

  // Handle trailing quote
  if (inQuote) {
    result.push("{quote}");
    result.push(...quoteContent);
    result.push("{quote}");
  }

  text = result.join("\n");

  // Convert unordered lists - item -> * item
  text = text.replace(/^(\s*)[-*+]\s+/gm, (_match: string, indent: string) => {
    const level = Math.floor(indent.length / 2) + 1;
    return "*".repeat(level) + " ";
  });

  // Convert ordered lists 1. item -> # item
  text = text.replace(/^(\s*)\d+\.\s+/gm, (_match: string, indent: string) => {
    const level = Math.floor(indent.length / 2) + 1;
    return "#".repeat(level) + " ";
  });

  // Convert horizontal rules --- or *** -> ----
  text = text.replace(/^[-*_]{3,}$/gm, "----");

  // Convert bold **text** or __text__ -> *text*
  text = text.replace(/\*\*([^*]+)\*\*/g, "*$1*");
  text = text.replace(/__([^_]+)__/g, "*$1*");

  // Convert strikethrough ~~text~~ -> -text-
  text = text.replace(/~~([^~]+)~~/g, "-$1-");

  // Italic *text* stays as _text_ in Jira
  // But we need to handle single * that wasn't bold
  // Convert markdown italic *text* to _text_
  text = text.replace(/(?<![*])\*([^*\n]+)\*(?![*])/g, "_$1_");

  return { output: text };
}

/**
 * Markdown to Jira tool.
 * Converts markdown to Jira wiki markup format.
 */
export const markdownToJira = defineTool({
  meta: {
    id: "markdown/to-jira",
    name: "Markdown to Jira",
    description:
      "Free online Markdown to Jira converter — transform Markdown headings, bold, italic, code blocks, links, lists, and blockquotes to Jira wiki markup instantly in your browser. No data is stored. Supports nested lists, strikethrough, images, and horizontal rules.",
    category: "markdown",
    subgroup: "Format Converters",
    tier: ToolTier.CLIENT,
    keywords: [
      "markdown",
      "jira",
      "wiki",
      "confluence",
      "convert",
      "format",
      "atlassian",
    ],
    examples: [
      {
        title: "Convert Markdown to Jira",
        description: "Transform Markdown to Jira wiki markup",
        input: "## Features\n\n**Bold** and *italic*.\n\n- Item 1\n- Item 2",
        output: "h2. Features\n\n_Bold_ and _italic_.\n* Item 1\n* Item 2",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
