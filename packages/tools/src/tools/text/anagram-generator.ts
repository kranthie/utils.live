import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { TEXT_EMPTY_INPUT } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Word or phrase to generate anagrams from"),
});

const optionsSchema = z.object({
  limit: z.number().min(1).max(100).default(20).describe("Maximum anagrams"),
  minLength: z.number().min(1).default(2).describe("Minimum word length"),
});

const outputSchema = z.object({
  anagrams: z.array(z.string()).describe("Generated anagrams"),
  totalPossible: z.number().describe("Estimated total permutations"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Shuffle array using Fisher-Yates algorithm.
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Calculate factorial (with limit).
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  if (n > 12) return Infinity; // Prevent overflow
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/**
 * Generates anagrams of input text.
 */
function execute(input: Input, options?: Options): Output {
  const limit = options?.limit ?? 20;
  const minLength = options?.minLength ?? 2;

  const cleaned = input.input.toLowerCase().replace(/[^a-z]/g, "");

  if (cleaned.length < minLength) {
    throw createToolError({
      code: TEXT_EMPTY_INPUT,
      message: `Input too short (min ${minLength} letters)`,
    });
  }

  if (cleaned.length > 10) {
    throw createToolError({
      code: TEXT_EMPTY_INPUT,
      message: "Input too long (max 10 letters for performance)",
    });
  }

  const letters = cleaned.split("");
  const totalPossible = factorial(letters.length);

  // Generate unique anagrams.
  // Do NOT cap attempts to totalPossible — for inputs with repeated letters,
  // factorial(n) underestimates the number of shuffles needed to hit all
  // distinct permutations (e.g. "aab" has factorial(3)=6 orderings but only
  // 3 distinct strings, so capping at 6 attempts is not enough).
  const anagrams = new Set<string>();
  const maxAttempts = limit * 100;

  for (let i = 0; i < maxAttempts && anagrams.size < limit; i++) {
    const shuffled = shuffle(letters).join("");
    if (shuffled !== cleaned) {
      anagrams.add(shuffled);
    }
  }

  return {
    anagrams: Array.from(anagrams).slice(0, limit),
    totalPossible: totalPossible === Infinity ? -1 : totalPossible - 1,
  };
}

/**
 * Anagram Generator tool.
 * Generates anagram permutations of input text.
 */
export const anagramGenerator = defineTool({
  meta: {
    id: "text/anagram-generator",
    name: "Letter Shuffler",
    description:
      "Free online letter shuffler — randomly rearrange letters in a word or phrase instantly in your browser. No data is stored. Generates permutations with configurable limit and minimum length.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: [
      "text",
      "letter",
      "shuffle",
      "anagram",
      "permutation",
      "rearrange",
    ],
    examples: [
      {
        title: "Shuffle a word",
        description: "Generate letter permutations of a short word",
        input: "listen",
        output:
          "(Random letter permutations of input — output varies each run)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
