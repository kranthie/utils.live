import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to format for Telegram"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["html", "markdown"])
    .default("html")
    .describe("Telegram parse mode"),
});

const outputSchema = z.object({
  output: z.string().describe("Telegram formatted text"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function toTelegramHtml(text: string): string {
  let result = text;

  // Convert markdown to Telegram HTML
  // Code blocks must be processed before inline code
  result = result.replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre>$2</pre>");
  result = result.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  result = result.replace(/\*([^*]+)\*/g, "<i>$1</i>");
  result = result.replace(/__([^_]+)__/g, "<u>$1</u>");
  result = result.replace(/_([^_]+)_/g, "<i>$1</i>");
  result = result.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Convert blockquotes
  result = result.replace(/^>\s?(.*)$/gm, "<blockquote>$1</blockquote>");

  return result;
}

function toTelegramMarkdown(text: string): string {
  let result = text;

  // Telegram MarkdownV2 requires escaping special characters
  // Special chars: _*[]()~`>#+-=|{}.!
  const escapeChars = (str: string): string =>
    str.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");

  // First escape everything, then unapply for formatting
  const lines = result.split("\n");
  const processed: string[] = [];

  // Use a zero-width space as marker that won't appear in normal text
  const M = "\u200B";

  for (const line of lines) {
    let l = line;

    // Process inline formatting before escaping
    const formats: Array<{ regex: RegExp; replacement: string }> = [
      {
        regex: /\*\*([^*]+)\*\*/g,
        replacement: `${M}BOLDS${M}$1${M}BOLDE${M}`,
      },
      {
        regex: /\*([^*]+)\*/g,
        replacement: `${M}ITALS${M}$1${M}ITALE${M}`,
      },
      {
        regex: /__([^_]+)__/g,
        replacement: `${M}UNDRS${M}$1${M}UNDRE${M}`,
      },
      {
        regex: /_([^_]+)_/g,
        replacement: `${M}ITAL2S${M}$1${M}ITAL2E${M}`,
      },
      {
        regex: /~~([^~]+)~~/g,
        replacement: `${M}STRKS${M}$1${M}STRKE${M}`,
      },
      {
        regex: /`([^`]+)`/g,
        replacement: `${M}CODES${M}$1${M}CODEE${M}`,
      },
      {
        regex: /\[([^\]]+)\]\(([^)]+)\)/g,
        replacement: `${M}LNKS${M}$1${M}LNKM${M}$2${M}LNKE${M}`,
      },
    ];

    for (const fmt of formats) {
      l = l.replace(fmt.regex, fmt.replacement);
    }

    l = escapeChars(l);

    // Restore formatting
    const mkRe = (tag: string): RegExp => new RegExp(`${M}${tag}${M}`, "g");
    l = l.replace(mkRe("BOLDS"), "*").replace(mkRe("BOLDE"), "*");
    l = l.replace(mkRe("ITALS"), "_").replace(mkRe("ITALE"), "_");
    l = l.replace(mkRe("UNDRS"), "__").replace(mkRe("UNDRE"), "__");
    l = l.replace(mkRe("ITAL2S"), "_").replace(mkRe("ITAL2E"), "_");
    l = l.replace(mkRe("STRKS"), "~").replace(mkRe("STRKE"), "~");
    l = l.replace(mkRe("CODES"), "`").replace(mkRe("CODEE"), "`");
    l = l
      .replace(mkRe("LNKS"), "[")
      .replace(mkRe("LNKM"), "](")
      .replace(mkRe("LNKE"), ")");

    processed.push(l);
  }

  result = processed.join("\n");
  return result;
}

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const mode = options?.mode ?? "html";

  if (mode === "html") {
    return { output: toTelegramHtml(input.input) };
  } else {
    return { output: toTelegramMarkdown(input.input) };
  }
}

export const telegramFormatter = defineTool({
  meta: {
    id: "communication/telegram-formatter",
    name: "Telegram Formatter",
    description:
      "Free online Telegram formatter — convert Markdown to Telegram HTML or MarkdownV2 format instantly in your browser. No data is stored. Converts bold, italic, underline, strikethrough, code, links, and blockquotes with proper escaping for Telegram Bot API.",
    category: "communication",
    subgroup: "Messaging",
    tier: ToolTier.CLIENT,
    keywords: [
      "telegram",
      "format",
      "html",
      "markdown",
      "message",
      "bot",
      "api",
      "markdownv2",
      "parse-mode",
    ],
    examples: [
      {
        title: "Markdown to Telegram HTML",
        description:
          "Convert Markdown bold, italic, and links to Telegram HTML format for the Bot API",
        input:
          "**Breaking News:** Check out our _latest update_ at [our site](https://example.com)!",
        output:
          '<b>Breaking News:</b> Check out our <i>latest update</i> at <a href="https://example.com">our site</a>!',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
