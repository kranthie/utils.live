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
        word: z.string(),
        count: z.number(),
        percentage: z.number(),
      })
    )
    .describe("Word frequencies"),
  totalWords: z.number().describe("Total word count"),
  uniqueWords: z.number().describe("Unique word count"),
});

const optionsSchema = z.object({
  caseSensitive: z.boolean().default(false).describe("Case-sensitive counting"),
  minLength: z.number().int().min(1).default(1).describe("Minimum word length"),
  limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
  excludeCommon: z
    .boolean()
    .default(false)
    .describe("Exclude common stop words"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
  "the",
  "this",
  "but",
  "they",
  "have",
  "had",
  "what",
  "when",
  "where",
  "who",
  "which",
  "why",
  "how",
  "i",
  "you",
  "we",
  "your",
  "our",
  "their",
  "his",
  "her",
  "it's",
  "can",
  "could",
  "would",
  "should",
  "do",
  "does",
  "did",
  "been",
  "being",
  "am",
  "or",
  "if",
  "then",
  "so",
  "than",
  "too",
  "very",
  "just",
  "about",
  "also",
  "into",
  "over",
  "after",
  "before",
  "between",
]);

/**
 * Counts word frequencies.
 */
function execute(input: Input, options?: Options): Output {
  const caseSensitive = options?.caseSensitive ?? false;
  const minLength = options?.minLength ?? 1;
  const limit = options?.limit ?? 50;
  const excludeCommon = options?.excludeCommon ?? false;

  // Extract words
  const words = input.input
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= minLength)
    .map((w) => (caseSensitive ? w : w.toLowerCase()));

  // Count frequencies
  const counts = new Map<string, number>();

  for (const word of words) {
    if (excludeCommon && STOP_WORDS.has(word.toLowerCase())) {
      continue;
    }
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  // Sort by frequency
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const totalWords = words.length;
  const frequencies = sorted.map(([word, count]) => ({
    word,
    count,
    percentage: Math.round((count / totalWords) * 10000) / 100,
  }));

  return {
    frequencies,
    totalWords,
    uniqueWords: counts.size,
  };
}

/**
 * Word Frequency tool.
 * Counts word occurrences.
 */
export const wordFrequency = defineTool({
  meta: {
    id: "text/word-frequency",
    name: "Word Frequency",
    description:
      "Free online word frequency counter — count word occurrences and percentages in text instantly in your browser. No data is stored. Supports case-sensitive mode, minimum word length, stop word exclusion, and configurable result limits.",
    category: "text",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["word", "frequency", "count", "occurrence", "statistics"],
    examples: [
      {
        title: "Count word frequencies",
        description: "Find the most common words in a sentence",
        input: "the cat sat on the mat and the cat slept",
        output:
          '{"frequencies":[{"word":"the","count":3,"percentage":30},{"word":"cat","count":2,"percentage":20},{"word":"sat","count":1,"percentage":10},{"word":"on","count":1,"percentage":10},{"word":"mat","count":1,"percentage":10},{"word":"and","count":1,"percentage":10},{"word":"slept","count":1,"percentage":10}],"totalWords":10,"uniqueWords":7}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
