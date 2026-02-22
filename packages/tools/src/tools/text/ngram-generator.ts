import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to generate n-grams from"),
});

const outputSchema = z.object({
  ngrams: z
    .array(
      z.object({
        ngram: z.string(),
        count: z.number(),
        percentage: z.number(),
      })
    )
    .describe("N-grams with frequencies"),
  totalNgrams: z.number().describe("Total n-gram count"),
  uniqueNgrams: z.number().describe("Unique n-gram count"),
});

const optionsSchema = z.object({
  n: z.number().int().min(1).max(5).default(2).describe("N-gram size"),
  type: z.enum(["word", "character"]).default("word").describe("N-gram type"),
  caseSensitive: z.boolean().default(false).describe("Case-sensitive"),
  limit: z.number().int().min(1).max(500).default(50).describe("Max results"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Generates n-grams from text.
 */
function execute(input: Input, options?: Options): Output {
  const n = options?.n ?? 2;
  const type = options?.type ?? "word";
  const caseSensitive = options?.caseSensitive ?? false;
  const limit = options?.limit ?? 50;

  const text = caseSensitive ? input.input : input.input.toLowerCase();
  const counts = new Map<string, number>();

  if (type === "word") {
    // Word n-grams
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(" ");
      counts.set(ngram, (counts.get(ngram) || 0) + 1);
    }
  } else {
    // Character n-grams
    const chars = text.replace(/\s+/g, " ");

    for (let i = 0; i <= chars.length - n; i++) {
      const ngram = chars.slice(i, i + n);
      counts.set(ngram, (counts.get(ngram) || 0) + 1);
    }
  }

  // Sort by frequency
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const totalNgrams = [...counts.values()].reduce((a, b) => a + b, 0);

  const ngrams = sorted.map(([ngram, count]) => ({
    ngram,
    count,
    percentage:
      totalNgrams > 0 ? Math.round((count / totalNgrams) * 10000) / 100 : 0,
  }));

  return {
    ngrams,
    totalNgrams,
    uniqueNgrams: counts.size,
  };
}

/**
 * N-gram Generator tool.
 * Generates n-grams from text.
 */
export const ngramGenerator = defineTool({
  meta: {
    id: "text/ngram-generator",
    name: "N-gram Generator",
    description:
      "Free online n-gram generator — create word or character n-grams with frequency counts instantly in your browser. No data is stored. Configurable n-gram size (1-5), word or character mode, and result limits.",
    category: "text",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["ngram", "bigram", "trigram", "frequency", "analysis"],
    examples: [
      {
        title: "Generate word bigrams",
        description: "Create word-level bigrams from a sentence",
        input: "the cat sat on the mat",
        output:
          '{"ngrams":[{"ngram":"the cat","count":1,"percentage":20},{"ngram":"cat sat","count":1,"percentage":20},{"ngram":"sat on","count":1,"percentage":20},{"ngram":"on the","count":1,"percentage":20},{"ngram":"the mat","count":1,"percentage":20}],"totalNgrams":5,"uniqueNgrams":5}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
