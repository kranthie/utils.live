import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown text to convert to BBCode"),
});

const outputSchema = z.object({
  output: z.string().describe("BBCode formatted text"),
});

const optionsSchema = z.object({
  headerSizes: z
    .object({
      h1: z.number().min(1).max(7).default(7),
      h2: z.number().min(1).max(7).default(6),
      h3: z.number().min(1).max(7).default(5),
      h4: z.number().min(1).max(7).default(4),
      h5: z.number().min(1).max(7).default(3),
      h6: z.number().min(1).max(7).default(2),
    })
    .prefault({})
    .describe("Size values for headers (1-7 scale)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts markdown to BBCode format.
 *
 * Conversions:
 * - **bold** or __bold__ -> [b]bold[/b]
 * - *italic* or _italic_ -> [i]italic[/i]
 * - `code` -> [code]code[/code]
 * - ```code``` -> [code]code[/code]
 * - [link](url) -> [url=url]link[/url]
 * - ![alt](url) -> [img]url[/img]
 * - # Header -> [size=7][b]Header[/b][/size]
 * - ## Header -> [size=6][b]Header[/b][/size]
 * - > quote -> [quote]...[/quote]
 * - - item -> [list][*]item[/list]
 * - 1. item -> [list=1][*]item[/list]
 * - ~~strikethrough~~ -> [s]strikethrough[/s]
 * - horizontal rule --- -> [hr]
 */
function execute(input: Input, options?: Options): Output {
  const headerSizes = {
    h1: options?.headerSizes?.h1 ?? 7,
    h2: options?.headerSizes?.h2 ?? 6,
    h3: options?.headerSizes?.h3 ?? 5,
    h4: options?.headerSizes?.h4 ?? 4,
    h5: options?.headerSizes?.h5 ?? 3,
    h6: options?.headerSizes?.h6 ?? 2,
  };

  let text = input.input;

  // Convert fenced code blocks ```code``` -> [code]code[/code]
  text = text.replace(/```\w*\n?([\s\S]*?)```/g, "[code]$1[/code]");

  // Convert inline code `code` -> [code]code[/code]
  text = text.replace(/`([^`]+)`/g, "[code]$1[/code]");

  // Convert images ![alt](url) -> [img]url[/img]
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "[img]$2[/img]");

  // Convert links [text](url) -> [url=url]text[/url]
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "[url=$2]$1[/url]");

  // Convert headers with size tags
  text = text.replace(
    /^#{6}\s+(.+)$/gm,
    `[size=${headerSizes.h6}][b]$1[/b][/size]`
  );
  text = text.replace(
    /^#{5}\s+(.+)$/gm,
    `[size=${headerSizes.h5}][b]$1[/b][/size]`
  );
  text = text.replace(
    /^#{4}\s+(.+)$/gm,
    `[size=${headerSizes.h4}][b]$1[/b][/size]`
  );
  text = text.replace(
    /^#{3}\s+(.+)$/gm,
    `[size=${headerSizes.h3}][b]$1[/b][/size]`
  );
  text = text.replace(
    /^#{2}\s+(.+)$/gm,
    `[size=${headerSizes.h2}][b]$1[/b][/size]`
  );
  text = text.replace(
    /^#{1}\s+(.+)$/gm,
    `[size=${headerSizes.h1}][b]$1[/b][/size]`
  );

  // Convert blockquotes
  // Handle multiline quotes by grouping consecutive > lines
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
        result.push("[quote]" + quoteContent.join("\n") + "[/quote]");
        inQuote = false;
        quoteContent = [];
      }
      result.push(line);
    }
  }

  // Handle trailing quote
  if (inQuote) {
    result.push("[quote]" + quoteContent.join("\n") + "[/quote]");
  }

  text = result.join("\n");

  // Convert unordered lists
  // This is more complex as we need to group consecutive list items
  text = convertLists(text);

  // Convert horizontal rules --- -> [hr]
  text = text.replace(/^[-*_]{3,}$/gm, "[hr]");

  // Convert bold **text** or __text__ -> [b]text[/b]
  text = text.replace(/\*\*([^*]+)\*\*/g, "[b]$1[/b]");
  text = text.replace(/__([^_]+)__/g, "[b]$1[/b]");

  // Convert strikethrough ~~text~~ -> [s]text[/s]
  text = text.replace(/~~([^~]+)~~/g, "[s]$1[/s]");

  // Convert italic *text* or _text_ -> [i]text[/i]
  // Be careful with underscore in words
  text = text.replace(/(?<![*])\*([^*\n]+)\*(?![*])/g, "[i]$1[/i]");
  text = text.replace(
    /(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g,
    "[i]$1[/i]"
  );

  return { output: text };
}

/**
 * Convert markdown lists to BBCode lists.
 * Groups consecutive list items and handles ordered vs unordered.
 */
function convertLists(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;
  let listItems: string[] = [];

  const flushList = (): void => {
    if (inUnorderedList && listItems.length > 0) {
      result.push("[list]");
      listItems.forEach((item) => result.push(`[*]${item}`));
      result.push("[/list]");
    } else if (inOrderedList && listItems.length > 0) {
      result.push("[list=1]");
      listItems.forEach((item) => result.push(`[*]${item}`));
      result.push("[/list]");
    }
    listItems = [];
    inUnorderedList = false;
    inOrderedList = false;
  };

  for (const line of lines) {
    const unorderedMatch = line.match(/^[-*+]\s+(.+)$/);
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);

    if (unorderedMatch && unorderedMatch[1]) {
      if (inOrderedList) {
        flushList();
      }
      inUnorderedList = true;
      listItems.push(unorderedMatch[1]);
    } else if (orderedMatch && orderedMatch[1]) {
      if (inUnorderedList) {
        flushList();
      }
      inOrderedList = true;
      listItems.push(orderedMatch[1]);
    } else {
      flushList();
      result.push(line);
    }
  }

  flushList();

  return result.join("\n");
}

/**
 * Markdown to BBCode tool.
 * Converts markdown to BBCode format used in forums.
 */
export const markdownToBbcode = defineTool({
  meta: {
    id: "markdown/to-bbcode",
    name: "Markdown to BBCode",
    description:
      "Free online Markdown to BBCode converter — transform Markdown headings, bold, italic, links, images, lists, and code blocks to BBCode forum format instantly in your browser. No data is stored. Supports configurable header sizes, blockquotes, and strikethrough.",
    category: "markdown",
    subgroup: "Format Converters",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "bbcode", "forum", "convert", "format", "bulletin"],
    examples: [
      {
        title: "Convert Markdown to BBCode",
        description: "Transform Markdown formatting to BBCode for forums",
        input:
          "# Hello\n\n**Bold** and *italic* text.\n\n[Link](https://example.com)",
        output:
          "[size=7][b]Hello[/b][/size]\n\n[b]Bold[/b] and [i]italic[/i] text.\n\n[url=https://example.com]Link[/url]",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
