import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("First text"),
  second: z.string().describe("Second text"),
});

const outputSchema = z.object({
  similarity: z.number().describe("Semantic similarity score 0-100"),
  commonWords: z.array(z.string()).describe("Common significant words"),
  uniqueToFirst: z.array(z.string()).describe("Words unique to first text"),
  uniqueToSecond: z.array(z.string()).describe("Words unique to second text"),
  analysis: z.string().describe("Brief analysis of differences"),
});

type Input = z.infer<typeof inputSchema>;
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
  "where",
  "when",
  "why",
]);

/**
 * Extract significant words from text.
 */
function extractWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

/**
 * Computes semantic difference between texts.
 */
function execute(input: Input): Output {
  const words1 = extractWords(input.input);
  const words2 = extractWords(input.second);

  const common = new Set<string>();
  const uniqueToFirst = new Set<string>();
  const uniqueToSecond = new Set<string>();

  for (const word of words1) {
    if (words2.has(word)) {
      common.add(word);
    } else {
      uniqueToFirst.add(word);
    }
  }

  for (const word of words2) {
    if (!words1.has(word)) {
      uniqueToSecond.add(word);
    }
  }

  // Jaccard similarity
  const union = new Set([...words1, ...words2]);
  const similarity =
    union.size > 0
      ? Math.round((common.size / union.size) * 100)
      : input.input === input.second
        ? 100
        : 0;

  // Generate analysis
  let analysis: string;
  if (similarity >= 80) {
    analysis = "Texts are very similar with minor wording differences.";
  } else if (similarity >= 50) {
    analysis = "Texts share common themes but have significant differences.";
  } else if (similarity >= 20) {
    analysis = "Texts have some overlap but are mostly different.";
  } else {
    analysis = "Texts are substantially different with little in common.";
  }

  return {
    similarity,
    commonWords: Array.from(common).slice(0, 20),
    uniqueToFirst: Array.from(uniqueToFirst).slice(0, 20),
    uniqueToSecond: Array.from(uniqueToSecond).slice(0, 20),
    analysis,
  };
}

/**
 * Semantic Diff tool.
 * Compares texts for semantic similarity.
 */
export const semanticDiff = defineTool({
  meta: {
    id: "text/semantic-diff",
    name: "Word Overlap Diff",
    description:
      "Free online word overlap diff — compare vocabulary overlap between two texts using Jaccard similarity instantly in your browser. No data is stored. Shows common words, unique words per text, and a similarity percentage.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: [
      "text",
      "word",
      "overlap",
      "diff",
      "compare",
      "similarity",
      "jaccard",
    ],
    examples: [
      {
        title: "Compare two paragraphs",
        description: "Find word overlap between two related texts",
        input: {
          input:
            "JavaScript is a popular programming language for web development.",
          second: "Python is a popular programming language for data science.",
        },
        output:
          '{"similarity":33,"commonWords":["popular","programming","language"],"uniqueToFirst":["javascript","web","development"],"uniqueToSecond":["python","data","science"],"analysis":"Texts have some overlap but are mostly different."}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
