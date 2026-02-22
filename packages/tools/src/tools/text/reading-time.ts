import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to analyze"),
});

const outputSchema = z.object({
  minutes: z.number().describe("Estimated reading time in minutes"),
  seconds: z.number().describe("Estimated reading time in seconds"),
  formatted: z.string().describe("Human-readable reading time"),
  wordCount: z.number().describe("Word count"),
  wordsPerMinute: z.number().describe("Words per minute used"),
});

const optionsSchema = z.object({
  wordsPerMinute: z
    .number()
    .int()
    .min(100)
    .max(500)
    .default(200)
    .describe("Reading speed (words per minute)"),
  includeImages: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of images to account for (12 sec each)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Estimates reading time.
 */
function execute(input: Input, options?: Options): Output {
  const wordsPerMinute = options?.wordsPerMinute ?? 200;
  const includeImages = options?.includeImages ?? 0;

  const words = input.input
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = input.input.trim().length === 0 ? 0 : words.length;

  // Calculate reading time
  const textMinutes = wordCount / wordsPerMinute;
  const imageSeconds = includeImages * 12; // 12 seconds per image
  const totalSeconds = Math.round(textMinutes * 60 + imageSeconds);
  const totalMinutes = totalSeconds / 60;

  // Format output
  let formatted: string;
  if (totalMinutes < 1) {
    formatted = `${totalSeconds} sec read`;
  } else if (totalMinutes < 60) {
    const mins = Math.ceil(totalMinutes);
    formatted = `${mins} min read`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.ceil(totalMinutes % 60);
    formatted = mins > 0 ? `${hours} hr ${mins} min read` : `${hours} hr read`;
  }

  return {
    minutes: Math.round(totalMinutes * 100) / 100,
    seconds: totalSeconds,
    formatted,
    wordCount,
    wordsPerMinute,
  };
}

/**
 * Reading Time tool.
 * Estimates reading time for text.
 */
export const readingTime = defineTool({
  meta: {
    id: "text/reading-time",
    name: "Reading Time",
    description:
      "Free online reading time estimator — calculate how long it takes to read any text instantly in your browser. No data is stored. Configurable words-per-minute speed and image count adjustment.",
    category: "text",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["reading", "time", "estimate", "minutes", "words"],
    examples: [
      {
        title: "Estimate blog post reading time",
        description: "Calculate how long it takes to read a short passage",
        input:
          "This is a sample blog post with enough words to demonstrate the reading time calculator. It provides an estimate based on an average reading speed of two hundred words per minute.",
        output:
          '{"minutes":0.15,"seconds":9,"formatted":"9 sec read","wordCount":31,"wordsPerMinute":200}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
