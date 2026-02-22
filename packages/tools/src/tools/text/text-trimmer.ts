import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to trim"),
});

const outputSchema = z.object({
  output: z.string().describe("Trimmed text"),
  trimmedStart: z.number().describe("Characters trimmed from start"),
  trimmedEnd: z.number().describe("Characters trimmed from end"),
  totalTrimmed: z.number().describe("Total characters trimmed"),
});

const optionsSchema = z.object({
  mode: z.enum(["both", "start", "end"]).default("both").describe("Trim mode"),
  perLine: z.boolean().default(false).describe("Trim each line individually"),
  characters: z
    .string()
    .optional()
    .describe("Specific characters to trim (default: whitespace)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function trimString(
  str: string,
  mode: "both" | "start" | "end",
  chars?: string
): { result: string; trimmedStart: number; trimmedEnd: number } {
  const original = str;
  let result = str;
  let trimmedStart = 0;
  let trimmedEnd = 0;

  if (chars) {
    const charSet = new Set(chars);
    const isTrimmable = (ch: string): boolean => charSet.has(ch);

    if (mode === "both" || mode === "start") {
      let i = 0;
      while (i < result.length && isTrimmable(result[i] ?? "")) {
        i++;
      }
      trimmedStart = i;
      result = result.slice(i);
    }

    if (mode === "both" || mode === "end") {
      let i = result.length - 1;
      while (i >= 0 && isTrimmable(result[i] ?? "")) {
        i--;
      }
      trimmedEnd = result.length - 1 - i;
      result = result.slice(0, i + 1);
    }
  } else {
    switch (mode) {
      case "start":
        result = str.trimStart();
        trimmedStart = original.length - result.length;
        break;
      case "end":
        result = str.trimEnd();
        trimmedEnd = original.length - result.length;
        break;
      case "both":
      default:
        result = str.trim();
        trimmedStart = original.length - original.trimStart().length;
        trimmedEnd = original.length - original.trimEnd().length;
    }
  }

  return { result, trimmedStart, trimmedEnd };
}

/**
 * Trims whitespace from text.
 */
function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "both";
  const perLine = options?.perLine ?? false;
  const characters = options?.characters;

  let totalTrimmedStart = 0;
  let totalTrimmedEnd = 0;
  let output: string;

  if (perLine) {
    const lines = input.input.split(/\r?\n/);
    const trimmedLines = lines.map((line) => {
      const { result, trimmedStart, trimmedEnd } = trimString(
        line,
        mode,
        characters
      );
      totalTrimmedStart += trimmedStart;
      totalTrimmedEnd += trimmedEnd;
      return result;
    });
    output = trimmedLines.join("\n");
  } else {
    const { result, trimmedStart, trimmedEnd } = trimString(
      input.input,
      mode,
      characters
    );
    output = result;
    totalTrimmedStart = trimmedStart;
    totalTrimmedEnd = trimmedEnd;
  }

  return {
    output,
    trimmedStart: totalTrimmedStart,
    trimmedEnd: totalTrimmedEnd,
    totalTrimmed: totalTrimmedStart + totalTrimmedEnd,
  };
}

/**
 * Text Trimmer tool.
 * Trims leading/trailing whitespace.
 */
export const textTrimmer = defineTool({
  meta: {
    id: "text/trimmer",
    name: "Text Trimmer",
    description:
      "Free online text trimmer — remove leading and trailing whitespace from text instantly in your browser. No data is stored. Options for start/end/both trimming, per-line mode, and custom characters to trim.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["trim", "whitespace", "leading", "trailing", "strip"],
    examples: [
      {
        title: "Trim whitespace from lines",
        description: "Remove leading and trailing spaces from each line",
        input: "  hello world  \n  foo bar  ",
        output: "hello world  \n  foo bar",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
