import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to analyze"),
});

const outputSchema = z.object({
  frequencies: z
    .array(
      z.object({
        letter: z.string(),
        count: z.number(),
        percentage: z.number(),
      })
    )
    .describe("Letter frequencies"),
  totalLetters: z.number().describe("Total letter count"),
  mostCommon: z.string().describe("Most common letter"),
  leastCommon: z.string().describe("Least common letter"),
  vowelCount: z.number().describe("Vowel count"),
  consonantCount: z.number().describe("Consonant count"),
});

const optionsSchema = z.object({
  caseSensitive: z.boolean().default(false).describe("Case-sensitive counting"),
  includeAll: z
    .boolean()
    .default(false)
    .describe("Include letters with zero count"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/**
 * Counts letter frequencies.
 */
function execute(input: Input, options?: Options): Output {
  const caseSensitive = options?.caseSensitive ?? false;
  const includeAll = options?.includeAll ?? false;

  const text = caseSensitive ? input.input : input.input.toLowerCase();
  const counts = new Map<string, number>();

  // Initialize all letters if includeAll
  if (includeAll) {
    const letters = caseSensitive
      ? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
      : "abcdefghijklmnopqrstuvwxyz";
    for (const letter of letters) {
      counts.set(letter, 0);
    }
  }

  let totalLetters = 0;
  let vowelCount = 0;
  let consonantCount = 0;

  for (const char of text) {
    if (/[a-zA-Z]/.test(char)) {
      totalLetters++;
      const normalized = caseSensitive ? char : char.toLowerCase();
      counts.set(normalized, (counts.get(normalized) || 0) + 1);

      if (VOWELS.has(normalized.toLowerCase())) {
        vowelCount++;
      } else {
        consonantCount++;
      }
    }
  }

  // Sort by frequency
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const frequencies = sorted.map(([letter, count]) => ({
    letter,
    count,
    percentage:
      totalLetters > 0 ? Math.round((count / totalLetters) * 10000) / 100 : 0,
  }));

  const mostCommon = frequencies[0]?.letter ?? "";
  const leastCommon = sorted.filter((e) => e[1] > 0).pop()?.[0] ?? "";

  return {
    frequencies,
    totalLetters,
    mostCommon,
    leastCommon,
    vowelCount,
    consonantCount,
  };
}

/**
 * Letter Frequency tool.
 * Frequency analysis of letters.
 */
export const letterFrequency = defineTool({
  meta: {
    id: "text/letter-frequency",
    name: "Letter Frequency",
    description:
      "Free online letter frequency analyzer — count letter occurrences and percentages in text instantly in your browser. No data is stored. Shows most/least common letters, vowel/consonant counts, and case-sensitive mode.",
    category: "text",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["letter", "frequency", "count", "analysis", "cipher"],
    examples: [
      {
        title: "Analyze letter frequencies",
        description: "Count letter occurrences in a phrase",
        input: "hello world",
        output:
          '{"frequencies":[{"letter":"l","count":3,"percentage":30},{"letter":"o","count":2,"percentage":20},{"letter":"h","count":1,"percentage":10},{"letter":"e","count":1,"percentage":10},{"letter":"w","count":1,"percentage":10},{"letter":"r","count":1,"percentage":10},{"letter":"d","count":1,"percentage":10}],"totalLetters":10,"mostCommon":"l","leastCommon":"d","vowelCount":3,"consonantCount":7}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
