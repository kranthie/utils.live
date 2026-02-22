import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to analyze"),
});

const outputSchema = z.object({
  basic: z.object({
    characters: z.number(),
    charactersNoSpaces: z.number(),
    words: z.number(),
    uniqueWords: z.number(),
    sentences: z.number(),
    paragraphs: z.number(),
    lines: z.number(),
  }),
  averages: z.object({
    wordLength: z.number(),
    wordsPerSentence: z.number(),
    sentencesPerParagraph: z.number(),
    syllablesPerWord: z.number(),
  }),
  distribution: z.object({
    shortWords: z.number().describe("Words with 1-4 chars"),
    mediumWords: z.number().describe("Words with 5-8 chars"),
    longWords: z.number().describe("Words with 9+ chars"),
  }),
  vocabulary: z.object({
    richness: z.number().describe("Type-token ratio"),
    hapaxLegomena: z.number().describe("Words appearing once"),
  }),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function countSyllables(word: string): number {
  const lower = word.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.length <= 3) return 1;

  let count = 0;
  const vowels = "aeiouy";
  let prevWasVowel = false;

  for (const char of lower) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }

  // Handle silent e
  if (lower.endsWith("e") && count > 1) {
    count--;
  }

  return Math.max(1, count);
}

/**
 * Calculates detailed text statistics.
 */
function execute(input: Input): Output {
  const text = input.input;

  // Basic counts
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = text.trim().length === 0 ? 0 : words.length;

  // Unique words
  const wordSet = new Set(
    words.map((w) => w.toLowerCase().replace(/[^\w]/g, ""))
  );
  const uniqueWords = wordSet.size;

  // Sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;

  // Paragraphs
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Lines
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;

  // Word length distribution
  let shortWords = 0;
  let mediumWords = 0;
  let longWords = 0;
  let totalWordLength = 0;
  let totalSyllables = 0;

  const wordCounts = new Map<string, number>();

  for (const word of words) {
    const len = word.length;
    totalWordLength += len;
    totalSyllables += countSyllables(word);

    if (len <= 4) shortWords++;
    else if (len <= 8) mediumWords++;
    else longWords++;

    const normalized = word.toLowerCase().replace(/[^\w]/g, "");
    wordCounts.set(normalized, (wordCounts.get(normalized) || 0) + 1);
  }

  // Hapax legomena (words appearing exactly once)
  const hapaxLegomena = [...wordCounts.values()].filter((c) => c === 1).length;

  // Averages
  const avgWordLength = wordCount > 0 ? totalWordLength / wordCount : 0;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const avgSentencesPerParagraph =
    paragraphCount > 0 ? sentenceCount / paragraphCount : 0;
  const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;

  // Vocabulary richness (type-token ratio)
  const richness = wordCount > 0 ? uniqueWords / wordCount : 0;

  return {
    basic: {
      characters,
      charactersNoSpaces,
      words: wordCount,
      uniqueWords,
      sentences: sentenceCount,
      paragraphs: paragraphCount,
      lines: lineCount,
    },
    averages: {
      wordLength: Math.round(avgWordLength * 100) / 100,
      wordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
      sentencesPerParagraph: Math.round(avgSentencesPerParagraph * 100) / 100,
      syllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    },
    distribution: {
      shortWords,
      mediumWords,
      longWords,
    },
    vocabulary: {
      richness: Math.round(richness * 1000) / 1000,
      hapaxLegomena,
    },
  };
}

/**
 * Text Statistics tool.
 * Detailed text analytics.
 */
export const textStatistics = defineTool({
  meta: {
    id: "text/statistics",
    name: "Text Statistics",
    description:
      "Free online text statistics analyzer — count characters, words, sentences, paragraphs, and more instantly in your browser. No data is stored. Includes vocabulary richness, word length distribution, and syllable averages.",
    category: "text",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["text", "statistics", "analytics", "analysis", "metrics"],
    examples: [
      {
        title: "Paragraph Analysis",
        description:
          "Analyze a short paragraph and get word count, sentence count, and more",
        input:
          "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
        output:
          '{"basic":{"characters":85,"charactersNoSpaces":69,"words":17,"uniqueWords":16,"sentences":2,"paragraphs":1,"lines":1},"averages":{"wordLength":4.06,"wordsPerSentence":8.5,"sentencesPerParagraph":2,"syllablesPerWord":1.24},"distribution":{"shortWords":11,"mediumWords":6,"longWords":0},"vocabulary":{"richness":0.941,"hapaxLegomena":15}}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
