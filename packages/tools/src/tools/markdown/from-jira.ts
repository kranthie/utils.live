import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Jira wiki markup text to convert to markdown"),
});

const outputSchema = z.object({
  output: z.string().describe("Markdown formatted text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts Jira wiki markup to markdown format.
 *
 * Conversions:
 * - *bold* -> **bold**
 * - _italic_ -> _italic_ (stays same)
 * - {{code}} -> `code`
 * - {code}...{code} -> ```...```
 * - {code:lang}...{code} -> ```lang...```
 * - [link|url] -> [link](url)
 * - [url] -> [url](url)
 * - !url! -> ![](url)
 * - h1. Header -> # Header
 * - h2. Header -> ## Header
 * - {quote}...{quote} -> > ...
 * - * item -> - item
 * - # item -> 1. item
 * - -strikethrough- -> ~~strikethrough~~
 * - ---- -> ---
 */
function execute(input: Input): Output {
  let text = input.input;

  // Convert code blocks with language {code:lang}...{code} -> ```lang...```
  text = text.replace(/\{code:(\w+)\}\n?([\s\S]*?)\{code\}/g, "```$1\n$2```");

  // Convert code blocks without language {code}...{code} -> ```...```
  text = text.replace(/\{code\}\n?([\s\S]*?)\{code\}/g, "```\n$1```");

  // Convert inline code {{code}} -> `code`
  text = text.replace(/\{\{([^}]+)\}\}/g, "`$1`");

  // Convert images !url! -> ![](url)
  text = text.replace(/!([^!\s|]+)!/g, "![]($1)");

  // Convert links with text [text|url] -> [text](url)
  text = text.replace(/\[([^|\]]+)\|([^\]]+)\]/g, "[$1]($2)");

  // Convert plain links [url] -> [url](url) (if it looks like a URL)
  text = text.replace(/\[(https?:\/\/[^\]]+)\]/g, "[$1]($1)");

  // Convert headers h1. -> #, h2. -> ##, etc.
  text = text.replace(/^h1\.\s+(.+)$/gm, "# $1");
  text = text.replace(/^h2\.\s+(.+)$/gm, "## $1");
  text = text.replace(/^h3\.\s+(.+)$/gm, "### $1");
  text = text.replace(/^h4\.\s+(.+)$/gm, "#### $1");
  text = text.replace(/^h5\.\s+(.+)$/gm, "##### $1");
  text = text.replace(/^h6\.\s+(.+)$/gm, "###### $1");

  // Convert blockquotes {quote}...{quote} -> > ...
  text = text.replace(
    /\{quote\}\n?([\s\S]*?)\{quote\}/g,
    (_match: string, content: string) => {
      return content
        .split("\n")
        .map((line: string) => `> ${line}`)
        .join("\n");
    }
  );

  // Convert unordered lists * item -> - item
  // Handle nested lists (**, ***, etc.)
  text = text.replace(/^(\*+)\s+/gm, (_match: string, stars: string) => {
    const indentStr = "  ".repeat(stars.length - 1);
    return `${indentStr}- `;
  });

  // Convert ordered lists # item -> 1. item
  // Handle nested lists (##, ###, etc.)
  text = text.replace(
    /^(#+)\s+(?!#)/gm,
    (fullMatch: string, hashes: string) => {
      // Make sure we're not matching markdown headers (which have space after #)
      if (fullMatch.trim().startsWith("# ") && fullMatch.includes(". ")) {
        return fullMatch; // This is a header, not a list
      }
      const indentStr = "  ".repeat(hashes.length - 1);
      return `${indentStr}1. `;
    }
  );

  // Convert horizontal rules ---- -> ---
  text = text.replace(/^-{4,}$/gm, "---");

  // Convert strikethrough -text- -> ~~text~~
  // Be careful not to match list items or horizontal rules
  text = text.replace(
    /(?<![a-zA-Z0-9-])-([^-\n]+)-(?![a-zA-Z0-9-])/g,
    "~~$1~~"
  );

  // Convert bold *text* -> **text**
  // Be careful not to match list markers
  text = text.replace(
    /(?<![a-zA-Z0-9*])\*([^*\n]+)\*(?![a-zA-Z0-9*])/g,
    "**$1**"
  );

  // Italic _text_ stays the same in markdown

  return { output: text };
}

/**
 * Jira to Markdown tool.
 * Converts Jira wiki markup to markdown format.
 */
export const jiraToMarkdown = defineTool({
  meta: {
    id: "markdown/from-jira",
    name: "Jira to Markdown",
    description:
      "Free online Jira to Markdown converter — transform Jira wiki markup headers, bold, italic, code blocks, links, and lists to Markdown instantly in your browser. No data is stored. Supports nested lists, blockquotes, images, and strikethrough.",
    category: "markdown",
    subgroup: "Format Converters",
    tier: ToolTier.CLIENT,
    keywords: [
      "jira",
      "markdown",
      "wiki",
      "confluence",
      "convert",
      "format",
      "atlassian",
    ],
    examples: [
      {
        title: "Convert Jira markup to Markdown",
        description: "Transform Jira wiki formatting to Markdown",
        input:
          "h2. Features\n\n*Bold text* and _italic text_\n\n* Item one\n* Item two",
        output:
          "  1. Features\n\n**Bold text** and _italic text_\n\n- Item one\n- Item two",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
