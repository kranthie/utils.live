import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Slack mrkdwn text to convert to markdown"),
});

const outputSchema = z.object({
  output: z.string().describe("Markdown formatted text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts Slack mrkdwn to markdown format.
 *
 * Conversions:
 * - *bold* -> **bold**
 * - _italic_ -> _italic_ (stays same)
 * - `code` -> `code` (stays same)
 * - ```code``` -> ```code``` (stays same)
 * - <url|link> -> [link](url)
 * - <url> -> [url](url)
 * - ~strikethrough~ -> ~~strikethrough~~
 * - > quote -> > quote (stays same)
 * - <@USER_ID> -> @USER_ID
 * - <#CHANNEL_ID|channel-name> -> #channel-name
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

  // Convert user mentions <@USER_ID> -> @USER_ID
  text = text.replace(/<@([A-Z0-9]+)>/g, "@$1");

  // Convert channel mentions <#CHANNEL_ID|channel-name> -> #channel-name
  text = text.replace(/<#[A-Z0-9]+\|([^>]+)>/g, "#$1");

  // Convert channel mentions without name <#CHANNEL_ID> -> #CHANNEL_ID
  text = text.replace(/<#([A-Z0-9]+)>/g, "#$1");

  // Convert links with text <url|text> -> [text](url)
  text = text.replace(/<([^|>]+)\|([^>]+)>/g, "[$2]($1)");

  // Convert plain links <url> -> [url](url)
  text = text.replace(/<(https?:\/\/[^>]+)>/g, "[$1]($1)");

  // Convert strikethrough ~text~ -> ~~text~~
  // Be careful not to match inside URLs or other contexts
  text = text.replace(/(?<![a-zA-Z0-9])~([^~\n]+)~(?![a-zA-Z0-9])/g, "~~$1~~");

  // Convert bold *text* -> **text**
  // Need to be careful with asterisks that might be list markers
  text = text.replace(
    /(?<![a-zA-Z0-9*])\*([^*\n]+)\*(?![a-zA-Z0-9*])/g,
    "**$1**"
  );

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
 * Slack to Markdown tool.
 * Converts Slack mrkdwn to markdown format.
 */
export const slackToMarkdown = defineTool({
  meta: {
    id: "markdown/from-slack",
    name: "Slack to Markdown",
    description:
      "Free online Slack to Markdown converter — transform Slack mrkdwn bold, italic, links, mentions, channels, and strikethrough to standard Markdown instantly in your browser. No data is stored. Preserves code blocks and inline code during conversion.",
    category: "markdown",
    subgroup: "Format Converters",
    tier: ToolTier.CLIENT,
    keywords: ["slack", "markdown", "mrkdwn", "convert", "format", "chat"],
    examples: [
      {
        title: "Convert Slack mrkdwn to Markdown",
        description: "Transform Slack formatting to standard Markdown",
        input:
          "*Bold text* and _italic text_\n<https://example.com|Click here>",
        output:
          "**Bold text** and _italic text_\n[Click here](https://example.com)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
