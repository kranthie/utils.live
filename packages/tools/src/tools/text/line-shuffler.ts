import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text with lines to shuffle"),
});

const outputSchema = z.object({
  output: z.string().describe("Shuffled text"),
  lineCount: z.number().describe("Number of lines"),
});

const optionsSchema = z.object({
  ignoreEmpty: z.boolean().default(false).describe("Ignore empty lines"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Fisher-Yates shuffle algorithm.
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    const swap = result[j];
    if (temp !== undefined && swap !== undefined) {
      result[i] = swap;
      result[j] = temp;
    }
  }
  return result;
}

/**
 * Shuffles lines randomly.
 */
function execute(input: Input, options?: Options): Output {
  const ignoreEmpty = options?.ignoreEmpty ?? false;

  let lines = input.input.split(/\r?\n/);

  if (ignoreEmpty) {
    lines = lines.filter((line) => line.trim().length > 0);
  }

  const shuffled = shuffle(lines);

  return {
    output: shuffled.join("\n"),
    lineCount: shuffled.length,
  };
}

/**
 * Line Shuffler tool.
 * Randomizes line order.
 */
export const lineShuffler = defineTool({
  meta: {
    id: "text/line-shuffler",
    name: "Line Shuffler",
    description:
      "Free online line shuffler — randomly reorder lines of text instantly in your browser. No data is stored. Uses Fisher-Yates shuffle with option to ignore empty lines.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["shuffle", "random", "randomize", "lines", "order"],
    examples: [
      {
        title: "Shuffle a list",
        description: "Randomize the order of lines in a list",
        input: "Apple\nBanana\nCherry\nDate\nElderberry",
        output: "(Random line ordering — output varies each run)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
