import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to detect language"),
});

const outputSchema = z.object({
  detected: z.string().describe("Detected language code"),
  language: z.string().describe("Language name"),
  confidence: z.number().describe("Confidence score 0-100"),
  alternatives: z
    .array(
      z.object({
        code: z.string(),
        language: z.string(),
        confidence: z.number(),
      })
    )
    .describe("Alternative language matches"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Common trigrams for major languages
const LANGUAGE_PROFILES: Record<
  string,
  { name: string; trigrams: Set<string> }
> = {
  en: {
    name: "English",
    trigrams: new Set([
      "the",
      "and",
      "ing",
      "ion",
      "tio",
      "ent",
      "for",
      "tha",
      "her",
      "ere",
    ]),
  },
  es: {
    name: "Spanish",
    trigrams: new Set([
      "que",
      "los",
      "las",
      "ión",
      "ent",
      "del",
      "con",
      "ado",
      "est",
      "ara",
    ]),
  },
  fr: {
    name: "French",
    trigrams: new Set([
      "les",
      "des",
      "que",
      "ent",
      "ait",
      "est",
      "par",
      "ous",
      "ion",
      "tio",
    ]),
  },
  de: {
    name: "German",
    trigrams: new Set([
      "der",
      "die",
      "und",
      "ein",
      "sch",
      "ich",
      "den",
      "cht",
      "ung",
      "gen",
    ]),
  },
  it: {
    name: "Italian",
    trigrams: new Set([
      "che",
      "del",
      "ion",
      "ell",
      "per",
      "ent",
      "zio",
      "lla",
      "con",
      "gli",
    ]),
  },
  pt: {
    name: "Portuguese",
    trigrams: new Set([
      "que",
      "ção",
      "ent",
      "dos",
      "ade",
      "par",
      "est",
      "com",
      "ões",
      "nto",
    ]),
  },
  nl: {
    name: "Dutch",
    trigrams: new Set([
      "van",
      "een",
      "het",
      "den",
      "aan",
      "oor",
      "ver",
      "ing",
      "ijk",
      "aar",
    ]),
  },
  ru: {
    name: "Russian",
    trigrams: new Set([
      "ост",
      "про",
      "ени",
      "ого",
      "ать",
      "ния",
      "при",
      "ста",
      "ной",
      "тор",
    ]),
  },
  zh: {
    name: "Chinese",
    trigrams: new Set([
      "的是",
      "不是",
      "我们",
      "他们",
      "这是",
      "什么",
      "可以",
      "没有",
      "一个",
      "就是",
    ]),
  },
  ja: {
    name: "Japanese",
    trigrams: new Set([
      "する",
      "です",
      "ます",
      "して",
      "した",
      "から",
      "ない",
      "この",
      "その",
      "あり",
    ]),
  },
};

/**
 * Extract trigrams from text.
 */
function extractTrigrams(text: string): Map<string, number> {
  const trigrams = new Map<string, number>();
  const cleaned = text.toLowerCase().replace(/\s+/g, " ");

  for (let i = 0; i <= cleaned.length - 3; i++) {
    const trigram = cleaned.substring(i, i + 3);
    if (!/^\s|\s$/.test(trigram)) {
      trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1);
    }
  }

  return trigrams;
}

/**
 * Detects the language of text.
 */
function execute(input: Input): Output {
  const textTrigrams = extractTrigrams(input.input);
  const scores: Array<{ code: string; language: string; score: number }> = [];

  for (const [code, profile] of Object.entries(LANGUAGE_PROFILES)) {
    let matchCount = 0;
    let totalCount = 0;

    for (const [trigram, count] of textTrigrams) {
      if (profile.trigrams.has(trigram)) {
        matchCount += count;
      }
      totalCount += count;
    }

    const score = totalCount > 0 ? (matchCount / totalCount) * 100 : 0;
    scores.push({
      code,
      language: profile.name,
      score: Math.round(score * 10) / 10,
    });
  }

  scores.sort((a, b) => b.score - a.score);

  const best = scores[0] ?? { code: "unknown", language: "Unknown", score: 0 };

  return {
    detected: best.code,
    language: best.language,
    confidence: Math.min(Math.round(best.score * 5), 100), // Scale up for display
    alternatives: scores.slice(1, 4).map((s) => ({
      code: s.code,
      language: s.language,
      confidence: Math.min(Math.round(s.score * 5), 100),
    })),
  };
}

/**
 * Language Detector tool.
 * Detects the language of text using trigram analysis.
 */
export const languageDetector = defineTool({
  meta: {
    id: "text/language-detector",
    name: "Language Detector",
    description:
      "Free online language detector — identify the language of any text using trigram analysis instantly in your browser. No data is stored. Supports English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Chinese, and Japanese.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["text", "language", "detect", "identify", "locale"],
    examples: [
      {
        title: "Detect English text",
        description: "Identify the language of an English sentence",
        input: "The quick brown fox jumps over the lazy dog in the garden.",
        output:
          '{"detected":"en","language":"English","confidence":44,"alternatives":[{"code":"nl","language":"Dutch","confidence":30},{"code":"de","language":"German","confidence":15},{"code":"es","language":"Spanish","confidence":0}]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
