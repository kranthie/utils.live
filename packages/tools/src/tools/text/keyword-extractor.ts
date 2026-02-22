import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract keywords from"),
});

const optionsSchema = z.object({
  limit: z.number().min(1).max(50).default(10).describe("Maximum keywords"),
  minLength: z.number().min(1).default(3).describe("Minimum word length"),
  stopWords: z.boolean().default(true).describe("Remove common stop words"),
});

const outputSchema = z.object({
  keywords: z
    .array(
      z.object({
        word: z.string(),
        count: z.number(),
        score: z.number(),
      })
    )
    .describe("Extracted keywords with scores"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "been",
  "be",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "used",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "what",
  "which",
  "who",
  "whom",
  "where",
  "when",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "also",
  "now",
  "here",
  "there",
  "then",
]);

/**
 * Extracts keywords from text.
 */
function execute(input: Input, options?: Options): Output {
  const limit = options?.limit ?? 10;
  const minLength = options?.minLength ?? 3;
  const useStopWords = options?.stopWords ?? true;

  // Tokenize and clean
  const words = input.input
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= minLength);

  // Count occurrences
  const counts = new Map<string, number>();
  for (const word of words) {
    if (useStopWords && STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  // Calculate frequency-based score (term frequency * word length)
  const totalWords = words.length;
  const keywords = Array.from(counts.entries())
    .map(([word, count]) => ({
      word,
      count,
      score: Math.round((count / totalWords) * word.length * 100) / 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { keywords };
}

/**
 * Keyword Extractor tool.
 * Extracts important keywords from text.
 */
export const keywordExtractor = defineTool({
  meta: {
    id: "text/keyword-extractor",
    name: "Keyword Extractor",
    description:
      "Free online keyword extractor — identify important keywords from text using frequency-based scoring instantly in your browser. No data is stored. Configurable stop word filtering, minimum word length, and result limits.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["text", "keyword", "extract", "frequency", "analyze"],
    examples: [
      {
        title: "Extract keywords from article",
        description: "Find the most important keywords in a paragraph",
        input:
          "Machine learning algorithms process large datasets to identify patterns. Deep learning neural networks enable advanced pattern recognition in complex datasets.",
        output:
          '{"keywords":[{"word":"learning","count":2,"score":0.89},{"word":"datasets","count":2,"score":0.89},{"word":"recognition","count":1,"score":0.61},{"word":"algorithms","count":1,"score":0.56},{"word":"identify","count":1,"score":0.44},{"word":"patterns","count":1,"score":0.44},{"word":"networks","count":1,"score":0.44},{"word":"advanced","count":1,"score":0.44},{"word":"machine","count":1,"score":0.39},{"word":"process","count":1,"score":0.39}]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
