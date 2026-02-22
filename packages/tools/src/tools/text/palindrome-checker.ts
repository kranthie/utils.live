import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to check for palindrome"),
});

const outputSchema = z.object({
  isPalindrome: z.boolean().describe("Whether text is a palindrome"),
  normalized: z.string().describe("Normalized text used for comparison"),
  reversed: z.string().describe("Reversed normalized text"),
});

const optionsSchema = z.object({
  ignoreCase: z.boolean().default(true).describe("Ignore case differences"),
  ignoreSpaces: z.boolean().default(true).describe("Ignore spaces"),
  ignorePunctuation: z.boolean().default(true).describe("Ignore punctuation"),
  ignoreNumbers: z.boolean().default(false).describe("Ignore numbers"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Checks if text is a palindrome.
 */
function execute(input: Input, options?: Options): Output {
  const ignoreCase = options?.ignoreCase ?? true;
  const ignoreSpaces = options?.ignoreSpaces ?? true;
  const ignorePunctuation = options?.ignorePunctuation ?? true;
  const ignoreNumbers = options?.ignoreNumbers ?? false;

  let normalized = input.input;

  if (ignoreCase) {
    normalized = normalized.toLowerCase();
  }

  if (ignoreSpaces) {
    normalized = normalized.replace(/\s/g, "");
  }

  if (ignorePunctuation) {
    normalized = normalized.replace(/[^\w\s]|_/g, "");
  }

  if (ignoreNumbers) {
    normalized = normalized.replace(/\d/g, "");
  }

  // Handle Unicode properly using spread
  const reversed = [...normalized].reverse().join("");

  return {
    isPalindrome: normalized === reversed,
    normalized,
    reversed,
  };
}

/**
 * Palindrome Checker tool.
 * Checks if text is a palindrome.
 */
export const palindromeChecker = defineTool({
  meta: {
    id: "text/palindrome-checker",
    name: "Palindrome Checker",
    description:
      "Free online palindrome checker — verify if text reads the same forwards and backwards instantly in your browser. No data is stored. Options to ignore case, spaces, punctuation, and numbers.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["palindrome", "check", "reverse", "mirror"],
    examples: [
      {
        title: "Check a palindrome phrase",
        description:
          "Verify if a sentence reads the same forwards and backwards",
        input: "A man, a plan, a canal: Panama",
        output:
          '{"isPalindrome":true,"normalized":"amanaplanacanalpanama","reversed":"amanaplanacanalpanama"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
