import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("String to measure"),
});

const outputSchema = z.object({
  characters: z.number().describe("Number of characters (code units)"),
  codePoints: z.number().describe("Number of Unicode code points"),
  bytes: z.number().describe("UTF-8 byte length"),
  words: z.number().describe("Number of words"),
  lines: z.number().describe("Number of lines"),
  output: z.string().describe("Summary of string metrics"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const str = input.input;
  const characters = str.length;
  const codePoints = [...str].length;
  const bytes = new TextEncoder().encode(str).length;
  const words = str.trim() ? str.trim().split(/\s+/).length : 0;
  const lines = str ? str.split(/\r?\n/).length : 0;

  const output = [
    `Characters (UTF-16): ${characters}`,
    `Code points: ${codePoints}`,
    `Bytes (UTF-8): ${bytes}`,
    `Words: ${words}`,
    `Lines: ${lines}`,
  ].join("\n");

  return { characters, codePoints, bytes, words, lines, output };
}

export const stringLength = defineTool({
  meta: {
    id: "misc/string-length",
    name: "String Length",
    description:
      "Free online string length calculator — count characters, code points, UTF-8 bytes, words, and lines instantly in your browser. No data is stored. Correctly handles Unicode, emoji, and multibyte characters.",
    category: "misc",
    subgroup: "String Utilities",
    tier: ToolTier.CLIENT,
    keywords: [
      "string",
      "length",
      "count",
      "bytes",
      "characters",
      "unicode",
      "words",
      "lines",
      "utf-8",
    ],
    examples: [
      {
        title: "Measure a plain ASCII string",
        description:
          "For ASCII text, characters, code points, and bytes all match",
        input: "Hello, World!",
        output:
          "Characters (UTF-16): 13\nCode points: 13\nBytes (UTF-8): 13\nWords: 2\nLines: 1",
      },
      {
        title: "Unicode text with multibyte characters",
        description:
          "Shows how accented characters and emoji differ in byte length vs code points",
        input: "Caf\u00e9 \u2615",
        output:
          "Characters (UTF-16): 6\nCode points: 6\nBytes (UTF-8): 9\nWords: 2\nLines: 1",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
