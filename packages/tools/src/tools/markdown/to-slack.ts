import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown text to convert to Slack mrkdwn"),
});

const outputSchema = z.object({
  output: z.string().describe("Slack mrkdwn formatted text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts markdown to Slack mrkdwn format.
 *
 * Conversions:
 * - **bold** or __bold__ -> *bold*
 * - *italic* or _italic_ -> _italic_
 * - `code` -> `code` (stays same)
 * - ```code``` -> ```code``` (stays same)
 * - [link](url) -> <url|link>
 * - # Header -> *HEADER*
 * - ## Header -> *Header*
 * - > quote -> > quote (stays same)
 * - - item -> - item (stays same)
 * - ~~strikethrough~~ -> ~strikethrough~
 */
function execute(input: Input): Output {
  let text = input.input;

  // Preserve code blocks by replacing them with placeholders
  const codeBlocks: string[] = [];
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Preserve inline code
  const inlineCode: string[] = [];
  text = text.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match);
    return `__INLINE_CODE_${inlineCode.length - 1}__`;
  });

  // Convert links [text](url) -> <url|text>
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<$2|$1>");

  // Convert images ![alt](url) -> <url|alt> (treat as links in Slack)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<$2|$1>");

  // Convert headers # Header -> *HEADER* (uppercase for h1)
  text = text.replace(
    /^#{1}\s+(.+)$/gm,
    (_match: string, content: string) => `*${content.toUpperCase()}*`
  );

  // Convert headers ## and below -> *Header*
  text = text.replace(/^#{2,6}\s+(.+)$/gm, "*$1*");

  // Convert bold **text** or __text__ -> *text*
  text = text.replace(/\*\*([^*]+)\*\*/g, "*$1*");
  text = text.replace(/__([^_]+)__/g, "*$1*");

  // Convert strikethrough ~~text~~ -> ~text~
  text = text.replace(/~~([^~]+)~~/g, "~$1~");

  // Italic stays the same (_text_ or *text*)
  // Note: We need to be careful not to double-convert bold that became *text*
  // Single * for italic in markdown should stay as _ in Slack
  // This is handled by converting ** first, then leaving single * alone

  // Restore inline code
  inlineCode.forEach((code, index) => {
    text = text.replace(`__INLINE_CODE_${index}__`, code);
  });

  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    text = text.replace(`__CODE_BLOCK_${index}__`, block);
  });

  return { output: text };
}

/**
 * Markdown to Slack tool.
 * Converts markdown to Slack mrkdwn format.
 */
export const markdownToSlack = defineTool({
  meta: {
    id: "markdown/to-slack",
    name: "Markdown to Slack",
    description:
      "Free online Markdown to Slack converter — transform Markdown headings, bold, links, images, and strikethrough to Slack mrkdwn format instantly in your browser. No data is stored. Converts headers to bold text, links to Slack angle-bracket syntax, and preserves code blocks.",
    category: "markdown",
    subgroup: "Format Converters",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "slack", "mrkdwn", "convert", "format", "chat"],
    examples: [
      {
        title: "Convert Markdown to Slack mrkdwn",
        description: "Transform Markdown to Slack-compatible formatting",
        input:
          "## Update\n\n**Bold** and *italic*.\n\n[Link](https://example.com)",
        output:
          "*Update*\n\n*Bold* and *italic*.\n\n<https://example.com|Link>",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
