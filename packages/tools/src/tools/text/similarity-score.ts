import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("First text"),
  input2: z.string().describe("Second text"),
});

const outputSchema = z.object({
  levenshtein: z.object({
    distance: z.number().describe("Levenshtein distance"),
    similarity: z.number().describe("Similarity percentage"),
  }),
  jaccard: z.number().describe("Jaccard similarity (0-1)"),
  cosine: z.number().describe("Cosine similarity (0-1)"),
  dice: z.number().describe("Dice coefficient (0-1)"),
  overallSimilarity: z.number().describe("Overall similarity percentage"),
});

const optionsSchema = z.object({
  caseSensitive: z
    .boolean()
    .default(false)
    .describe("Case-sensitive comparison"),
  ignoreWhitespace: z
    .boolean()
    .default(false)
    .describe("Ignore extra whitespace"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    const row = matrix[0];
    if (row) row[j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const row = matrix[i];
      const prevRow = matrix[i - 1];
      if (row && prevRow) {
        if (b[i - 1] === a[j - 1]) {
          row[j] = prevRow[j - 1] ?? 0;
        } else {
          row[j] = Math.min(
            (prevRow[j - 1] ?? 0) + 1, // substitution
            (prevRow[j] ?? 0) + 1, // deletion
            (row[j - 1] ?? 0) + 1 // insertion
          );
        }
      }
    }
  }

  const lastRow = matrix[b.length];
  return lastRow ? (lastRow[a.length] ?? 0) : 0;
}

function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [word, countA] of a) {
    const countB = b.get(word) || 0;
    dotProduct += countA * countB;
    normA += countA * countA;
  }

  for (const countB of b.values()) {
    normB += countB * countB;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

function diceCoefficent(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const total = a.size + b.size;
  return total === 0 ? 0 : (2 * intersection.size) / total;
}

/**
 * Calculates text similarity using multiple algorithms.
 */
function execute(input: Input, options?: Options): Output {
  const caseSensitive = options?.caseSensitive ?? false;
  const ignoreWhitespace = options?.ignoreWhitespace ?? false;

  let text1 = input.input1;
  let text2 = input.input2;

  if (!caseSensitive) {
    text1 = text1.toLowerCase();
    text2 = text2.toLowerCase();
  }

  if (ignoreWhitespace) {
    text1 = text1.replace(/\s+/g, " ").trim();
    text2 = text2.replace(/\s+/g, " ").trim();
  }

  // Levenshtein
  const levDistance = levenshteinDistance(text1, text2);
  const maxLen = Math.max(text1.length, text2.length);
  const levSimilarity = maxLen === 0 ? 100 : (1 - levDistance / maxLen) * 100;

  // Word-based metrics
  const words1 = getWords(text1);
  const words2 = getWords(text2);
  const wordSet1 = new Set(words1);
  const wordSet2 = new Set(words2);

  // Word frequency maps for cosine
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  for (const word of words1) {
    freq1.set(word, (freq1.get(word) || 0) + 1);
  }
  for (const word of words2) {
    freq2.set(word, (freq2.get(word) || 0) + 1);
  }

  const jaccard = jaccardSimilarity(wordSet1, wordSet2);
  const cosine = cosineSimilarity(freq1, freq2);
  const dice = diceCoefficent(wordSet1, wordSet2);

  // Overall similarity (weighted average)
  const overallSimilarity =
    levSimilarity * 0.3 +
    jaccard * 100 * 0.25 +
    cosine * 100 * 0.25 +
    dice * 100 * 0.2;

  return {
    levenshtein: {
      distance: levDistance,
      similarity: Math.round(levSimilarity * 100) / 100,
    },
    jaccard: Math.round(jaccard * 1000) / 1000,
    cosine: Math.round(cosine * 1000) / 1000,
    dice: Math.round(dice * 1000) / 1000,
    overallSimilarity: Math.round(overallSimilarity * 100) / 100,
  };
}

/**
 * Similarity Score tool.
 * Calculates text similarity using multiple algorithms.
 */
export const similarityScore = defineTool({
  meta: {
    id: "text/similarity-score",
    name: "Similarity Score",
    description:
      "Free online text similarity calculator — compare two texts using Levenshtein, Jaccard, cosine, and Dice algorithms instantly in your browser. No data is stored. Returns distance, similarity percentages, and a weighted overall score.",
    category: "text",
    subgroup: "Comparison",
    tier: ToolTier.CLIENT,
    keywords: ["similarity", "levenshtein", "jaccard", "cosine", "compare"],
    examples: [
      {
        title: "Compare similar sentences",
        description: "Calculate similarity scores between two sentences",
        input: { input1: "The quick brown fox", input2: "The fast brown fox" },
        output:
          '{"levenshtein":{"distance":5,"similarity":73.68},"jaccard":0.6,"cosine":0.75,"dice":0.75,"overallSimilarity":70.86}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
