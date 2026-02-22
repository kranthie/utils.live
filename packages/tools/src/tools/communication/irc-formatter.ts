import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to format with IRC color codes"),
});

const optionsSchema = z.object({
  color: z
    .enum([
      "white",
      "black",
      "blue",
      "green",
      "red",
      "brown",
      "purple",
      "orange",
      "yellow",
      "lightgreen",
      "cyan",
      "lightcyan",
      "lightblue",
      "pink",
      "grey",
      "lightgrey",
    ])
    .default("white")
    .describe("Text color"),
  background: z
    .enum([
      "none",
      "white",
      "black",
      "blue",
      "green",
      "red",
      "brown",
      "purple",
      "orange",
      "yellow",
      "lightgreen",
      "cyan",
      "lightcyan",
      "lightblue",
      "pink",
      "grey",
      "lightgrey",
    ])
    .default("none")
    .describe("Background color"),
  bold: z.boolean().default(false).describe("Apply bold"),
  italic: z.boolean().default(false).describe("Apply italic"),
  underline: z.boolean().default(false).describe("Apply underline"),
});

const outputSchema = z.object({
  output: z.string().describe("IRC formatted text with mIRC color codes"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

const IRC_COLORS: Record<string, string> = {
  white: "00",
  black: "01",
  blue: "02",
  green: "03",
  red: "04",
  brown: "05",
  purple: "06",
  orange: "07",
  yellow: "08",
  lightgreen: "09",
  cyan: "10",
  lightcyan: "11",
  lightblue: "12",
  pink: "13",
  grey: "14",
  lightgrey: "15",
};

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let text = input.input;

  // Convert markdown formatting to IRC
  text = text.replace(/\*\*([^*]+)\*\*/g, "\x02$1\x02"); // Bold
  text = text.replace(/\*([^*]+)\*/g, "\x1D$1\x1D"); // Italic
  text = text.replace(/__([^_]+)__/g, "\x1F$1\x1F"); // Underline
  text = text.replace(/_([^_]+)_/g, "\x1D$1\x1D"); // Italic

  // Apply formatting options
  const color = options?.color ?? "white";
  const bg = options?.background ?? "none";

  let prefix = "";
  let suffix = "";

  if (options?.bold) {
    prefix += "\x02";
    suffix = "\x02" + suffix;
  }
  if (options?.italic) {
    prefix += "\x1D";
    suffix = "\x1D" + suffix;
  }
  if (options?.underline) {
    prefix += "\x1F";
    suffix = "\x1F" + suffix;
  }

  if (color !== "white" || bg !== "none") {
    const colorCode = IRC_COLORS[color] ?? "00";
    if (bg !== "none") {
      const bgCode = IRC_COLORS[bg] ?? "00";
      prefix += `\x03${colorCode},${bgCode}`;
    } else {
      prefix += `\x03${colorCode}`;
    }
    suffix = "\x03" + suffix;
  }

  // Show both raw and display versions
  const raw = prefix + text + suffix;

  const BOLD = String.fromCharCode(0x02);
  const ITALIC = String.fromCharCode(0x1d);
  const UNDERLINE = String.fromCharCode(0x1f);
  const COLOR = String.fromCharCode(0x03);

  const display = raw
    .replace(new RegExp(BOLD, "g"), "[BOLD]")
    .replace(new RegExp(ITALIC, "g"), "[ITALIC]")
    .replace(new RegExp(UNDERLINE, "g"), "[UNDERLINE]")
    .replace(new RegExp(COLOR + "(\\d{1,2}(?:,\\d{1,2})?)", "g"), "[COLOR:$1]")
    .replace(new RegExp(COLOR, "g"), "[/COLOR]");

  return {
    output: `Raw (copy this):\n${raw}\n\nReadable:\n${display}`,
  };
}

export const ircFormatter = defineTool({
  meta: {
    id: "communication/irc-formatter",
    name: "IRC Formatter",
    description:
      "Free online IRC formatter — convert Markdown-style text to mIRC color codes instantly in your browser. No data is stored. Supports bold, italic, underline, 16 foreground colors, background colors, and Markdown syntax (**bold**, *italic*, __underline__).",
    category: "communication",
    subgroup: "Messaging",
    tier: ToolTier.CLIENT,
    keywords: [
      "irc",
      "format",
      "color",
      "mirc",
      "chat",
      "bold",
      "control-code",
      "freenode",
      "libera",
    ],
    examples: [
      {
        title: "Markdown to IRC control codes",
        description: "Convert Markdown bold and italic to IRC formatting codes",
        input: "**Alert:** Server _restarted_ at 03:15 UTC",
        output:
          "Raw (copy this):\n\u0002Alert:\u0002 Server \u001drestarted\u001d at 03:15 UTC\n\nReadable:\n[BOLD]Alert:[BOLD] Server [ITALIC]restarted[ITALIC] at 03:15 UTC",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
