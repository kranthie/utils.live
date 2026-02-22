import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("String with special characters to escape"),
});

const outputSchema = z.object({
  output: z.string().describe("Escaped regex pattern"),
  escapedCount: z.number().describe("Number of characters that were escaped"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

function execute(input: Input): Output {
  if (!input.input) throw new Error("Input cannot be empty");

  let escapedCount = 0;
  const output = input.input.replace(SPECIAL_CHARS, (match) => {
    escapedCount++;
    return `\\${match}`;
  });

  return { output, escapedCount };
}

export const regexEscape = defineTool({
  meta: {
    id: "regex/regex-escape",
    name: "Regex Escape",
    description:
      "Free online regex escape tool — escape special regex characters in strings for safe literal matching instantly in your browser. No data is stored. Escapes dots, brackets, parentheses, and all regex metacharacters.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "escape",
      "special",
      "characters",
      "literal",
      "metacharacter",
      "safe",
      "sanitize",
    ],
    examples: [
      {
        title: "Escape URL special characters for regex",
        description:
          "Escape special regex characters in a URL for literal matching",
        input: "https://example.com/path?q=1&r=2",
        output: "https://example\\.com/path\\?q=1&r=2",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
