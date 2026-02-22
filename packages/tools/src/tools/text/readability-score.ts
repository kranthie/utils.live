import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to analyze"),
});

const outputSchema = z.object({
  fleschReadingEase: z.object({
    score: z.number().describe("Flesch Reading Ease score (0-100)"),
    level: z.string().describe("Reading level description"),
  }),
  fleschKincaidGrade: z.number().describe("Flesch-Kincaid Grade Level"),
  gunningFog: z.number().describe("Gunning Fog Index"),
  colemanLiau: z.number().describe("Coleman-Liau Index"),
  automatedReadability: z.number().describe("Automated Readability Index"),
  smog: z.number().describe("SMOG Index"),
  averageGradeLevel: z.number().describe("Average of all grade levels"),
  summary: z.string().describe("Summary of readability"),
  stats: z.object({
    words: z.number(),
    sentences: z.number(),
    syllables: z.number(),
    complexWords: z.number(),
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

  if (lower.endsWith("e") && count > 1) {
    count--;
  }

  return Math.max(1, count);
}

function getFleschLevel(score: number): string {
  if (score >= 90) return "Very Easy (5th grade)";
  if (score >= 80) return "Easy (6th grade)";
  if (score >= 70) return "Fairly Easy (7th grade)";
  if (score >= 60) return "Standard (8th-9th grade)";
  if (score >= 50) return "Fairly Difficult (10th-12th grade)";
  if (score >= 30) return "Difficult (College)";
  return "Very Confusing (College graduate)";
}

/**
 * Calculates readability scores.
 */
function execute(input: Input): Output {
  const text = input.input;

  // Extract words and sentences
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = text.trim().length === 0 ? 0 : words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Count syllables and complex words
  let totalSyllables = 0;
  let complexWords = 0; // Words with 3+ syllables

  for (const word of words) {
    const syllables = countSyllables(word);
    totalSyllables += syllables;
    if (syllables >= 3) {
      complexWords++;
    }
  }

  // Character count (letters only)
  const letters = text.replace(/[^a-zA-Z]/g, "").length;

  // Handle edge cases
  if (wordCount === 0) {
    return {
      fleschReadingEase: { score: 0, level: "N/A - No text" },
      fleschKincaidGrade: 0,
      gunningFog: 0,
      colemanLiau: 0,
      automatedReadability: 0,
      smog: 0,
      averageGradeLevel: 0,
      summary: "No text to analyze",
      stats: { words: 0, sentences: 0, syllables: 0, complexWords: 0 },
    };
  }

  // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
  const fleschScore =
    206.835 -
    1.015 * (wordCount / sentenceCount) -
    84.6 * (totalSyllables / wordCount);
  const fleschClamped = Math.max(0, Math.min(100, fleschScore));

  // Flesch-Kincaid Grade Level: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
  const fkGrade =
    0.39 * (wordCount / sentenceCount) +
    11.8 * (totalSyllables / wordCount) -
    15.59;

  // Gunning Fog: 0.4*((words/sentences) + 100*(complexWords/words))
  const gunningFog =
    0.4 * (wordCount / sentenceCount + 100 * (complexWords / wordCount));

  // Coleman-Liau: 0.0588*L - 0.296*S - 15.8
  // L = average letters per 100 words, S = average sentences per 100 words
  const L = (letters / wordCount) * 100;
  const S = (sentenceCount / wordCount) * 100;
  const colemanLiau = 0.0588 * L - 0.296 * S - 15.8;

  // Automated Readability Index: 4.71*(characters/words) + 0.5*(words/sentences) - 21.43
  const automatedReadability =
    4.71 * (letters / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;

  // SMOG Index: 1.0430*sqrt(complexWords*(30/sentences)) + 3.1291
  const smog = 1.043 * Math.sqrt(complexWords * (30 / sentenceCount)) + 3.1291;

  // Average grade level
  const avgGradeLevel =
    (Math.max(0, fkGrade) +
      Math.max(0, gunningFog) +
      Math.max(0, colemanLiau) +
      Math.max(0, automatedReadability) +
      Math.max(0, smog)) /
    5;

  // Summary
  let summary: string;
  if (avgGradeLevel <= 6) {
    summary = "Text is suitable for elementary school readers";
  } else if (avgGradeLevel <= 8) {
    summary = "Text is suitable for middle school readers";
  } else if (avgGradeLevel <= 12) {
    summary = "Text is suitable for high school readers";
  } else if (avgGradeLevel <= 16) {
    summary = "Text is suitable for college-level readers";
  } else {
    summary = "Text is suitable for graduate-level readers";
  }

  return {
    fleschReadingEase: {
      score: Math.round(fleschClamped * 10) / 10,
      level: getFleschLevel(fleschClamped),
    },
    fleschKincaidGrade: Math.round(Math.max(0, fkGrade) * 10) / 10,
    gunningFog: Math.round(Math.max(0, gunningFog) * 10) / 10,
    colemanLiau: Math.round(Math.max(0, colemanLiau) * 10) / 10,
    automatedReadability:
      Math.round(Math.max(0, automatedReadability) * 10) / 10,
    smog: Math.round(Math.max(0, smog) * 10) / 10,
    averageGradeLevel: Math.round(avgGradeLevel * 10) / 10,
    summary,
    stats: {
      words: wordCount,
      sentences: sentenceCount,
      syllables: totalSyllables,
      complexWords,
    },
  };
}

/**
 * Readability Score tool.
 * Calculates Flesch-Kincaid and other readability metrics.
 */
export const readabilityScore = defineTool({
  meta: {
    id: "text/readability-score",
    name: "Readability Score",
    description:
      "Free online readability score calculator — compute Flesch-Kincaid, Gunning Fog, Coleman-Liau, SMOG, and ARI scores instantly in your browser. No data is stored. Provides grade levels, reading ease, and word/sentence/syllable stats.",
    category: "text",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["readability", "flesch", "kincaid", "grade", "level"],
    examples: [
      {
        title: "Analyze article readability",
        description: "Calculate readability scores for a paragraph",
        input:
          "The cat sat on the mat. It was a warm day. The sun was shining brightly in the clear blue sky.",
        output:
          '{"fleschReadingEase":{"score":100,"level":"Very Easy (5th grade)"},"fleschKincaidGrade":0.1,"gunningFog":2.8,"colemanLiau":0,"automatedReadability":0,"smog":3.1,"averageGradeLevel":1.2,"summary":"Text is suitable for elementary school readers","stats":{"words":21,"sentences":3,"syllables":23,"complexWords":0}}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
