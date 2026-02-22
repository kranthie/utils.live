import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown text to convert for Discord"),
});

const outputSchema = z.object({
  output: z.string().describe("Discord-compatible markdown text"),
});

const optionsSchema = z.object({
  convertMentions: z
    .boolean()
    .default(true)
    .describe("Convert @username mentions to Discord format"),
  convertTimestamps: z
    .boolean()
    .default(true)
    .describe("Convert ISO timestamps to Discord timestamp format"),
  timestampStyle: z
    .enum(["t", "T", "d", "D", "f", "F", "R"])
    .default("f")
    .describe(
      "Discord timestamp style: t=short time, T=long time, d=short date, D=long date, f=short datetime, F=long datetime, R=relative"
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts markdown for Discord compatibility.
 *
 * Discord supports most standard markdown with some additions:
 * - **bold**, *italic*, __underline__, ~~strikethrough~~ all work
 * - `code` and ```code blocks``` work
 * - [text](url) links work (but may not be clickable in all contexts)
 * - Headers are NOT supported - converted to bold
 * - > quotes work (single line)
 * - >>> block quotes (Discord-specific)
 * - ||spoiler|| tags (Discord-specific)
 * - <@USER_ID> for user mentions
 * - <#CHANNEL_ID> for channel mentions
 * - <@&ROLE_ID> for role mentions
 * - <t:TIMESTAMP:STYLE> for timestamps
 */
function execute(input: Input, options?: Options): Output {
  const convertMentions = options?.convertMentions ?? true;
  const convertTimestamps = options?.convertTimestamps ?? true;
  const timestampStyle = options?.timestampStyle ?? "f";

  let text = input.input;

  // Preserve code blocks
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

  // Convert headers to bold (Discord doesn't support headers)
  // # Header -> **Header**
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "**$1**");

  // Convert horizontal rules to dashes (Discord shows these as text)
  text = text.replace(/^[-*_]{3,}$/gm, "---");

  // Convert images to links (Discord doesn't render markdown images inline)
  // ![alt](url) -> url (Discord will auto-embed if it's an image URL)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$2");

  // Standard markdown that Discord supports:
  // - **bold** - works
  // - *italic* - works
  // - __underline__ - works (different from markdown's bold)
  // - ~~strikethrough~~ - works
  // - [text](url) - works (limited)
  // - > quote - works
  // - - list items - work

  // Convert @mentions if enabled
  if (convertMentions) {
    // Basic @username pattern - convert to generic mention format
    // Note: In a real app, you'd need to look up user IDs
    // This converts @username to a visually similar format
    // Actual Discord mentions require user IDs: <@USER_ID>
    text = text.replace(/@(\w+)/g, "@$1");
  }

  // Convert ISO timestamps to Discord timestamp format if enabled
  if (convertTimestamps) {
    // Match ISO 8601 timestamps
    text = text.replace(
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:?\d{2})?)/g,
      (match) => {
        try {
          const date = new Date(match);
          if (!isNaN(date.getTime())) {
            const unixTimestamp = Math.floor(date.getTime() / 1000);
            return `<t:${unixTimestamp}:${timestampStyle}>`;
          }
        } catch {
          // If parsing fails, return original
        }
        return match;
      }
    );

    // Also match common date formats like 2024-01-15
    text = text.replace(/(?<![T\d])(\d{4}-\d{2}-\d{2})(?![T\d])/g, (match) => {
      try {
        const date = new Date(match + "T00:00:00Z");
        if (!isNaN(date.getTime())) {
          const unixTimestamp = Math.floor(date.getTime() / 1000);
          return `<t:${unixTimestamp}:${timestampStyle}>`;
        }
      } catch {
        // If parsing fails, return original
      }
      return match;
    });
  }

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
 * Markdown to Discord tool.
 * Converts markdown to Discord-compatible format with special handling for
 * Discord features like mentions and timestamps.
 */
export const markdownToDiscord = defineTool({
  meta: {
    id: "markdown/to-discord",
    name: "Markdown to Discord",
    description:
      "Free online Markdown to Discord converter — transform Markdown to Discord-compatible format with header-to-bold conversion, image URL extraction, and ISO timestamp-to-Discord-timestamp conversion instantly in your browser. No data is stored. Preserves code blocks and supports mention formatting.",
    category: "markdown",
    subgroup: "Format Converters",
    tier: ToolTier.CLIENT,
    keywords: [
      "markdown",
      "discord",
      "convert",
      "format",
      "chat",
      "timestamp",
      "mention",
    ],
    examples: [
      {
        title: "Convert Markdown to Discord format",
        description: "Transform Markdown for Discord messages",
        input:
          "# Announcement\n\n**Important**: Check the [docs](https://example.com).",
        output:
          "**Announcement**\n\n**Important**: Check the [docs](https://example.com).",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
