import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { createToolError } from "../../core/errors";
import { TEXT_REGEX_INVALID } from "../../core/error-codes";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to search in"),
  find: z.string().describe("Text or regex pattern to find"),
  replace: z.string().describe("Replacement text"),
});

const outputSchema = z.object({
  output: z.string().describe("Text with replacements"),
  replacements: z.number().describe("Number of replacements made"),
  matches: z.array(z.string()).describe("Found matches"),
});

const optionsSchema = z.object({
  useRegex: z.boolean().default(false).describe("Treat find as regex pattern"),
  caseSensitive: z.boolean().default(true).describe("Case-sensitive search"),
  wholeWord: z.boolean().default(false).describe("Match whole words only"),
  replaceAll: z.boolean().default(true).describe("Replace all occurrences"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Finds and replaces text.
 */
function execute(input: Input, options?: Options): Output {
  const useRegex = options?.useRegex ?? false;
  const caseSensitive = options?.caseSensitive ?? true;
  const wholeWord = options?.wholeWord ?? false;
  const replaceAll = options?.replaceAll ?? true;

  let pattern: RegExp;

  try {
    if (useRegex) {
      const flags = caseSensitive ? "g" : "gi";
      pattern = replaceAll
        ? new RegExp(input.find, flags)
        : new RegExp(input.find, caseSensitive ? "" : "i");
    } else {
      // Escape special regex characters for literal search
      let escaped = input.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      if (wholeWord) {
        escaped = `\\b${escaped}\\b`;
      }

      const flags = replaceAll
        ? caseSensitive
          ? "g"
          : "gi"
        : caseSensitive
          ? ""
          : "i";
      pattern = new RegExp(escaped, flags);
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Invalid regular expression";
    throw createToolError({
      code: TEXT_REGEX_INVALID,
      message: `Invalid regex pattern: ${message}`,
    });
  }

  const matches: string[] = [];
  const matchResults = input.input.match(pattern);

  if (matchResults) {
    matches.push(...matchResults);
  }

  const output = input.input.replace(pattern, input.replace);

  return {
    output,
    replacements: matches.length,
    matches,
  };
}

/**
 * Find & Replace tool.
 * Simple and regex-powered find and replace.
 */
export const findReplace = defineTool({
  meta: {
    id: "text/find-replace",
    name: "Find & Replace",
    description:
      "Free online find and replace — search and substitute text with literal or regex patterns instantly in your browser. No data is stored. Supports case-sensitive, whole-word, and regex-powered replacements.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["find", "replace", "search", "substitute", "regex"],
    examples: [
      {
        title: "Simple text replacement",
        description: "Replace all occurrences of a word in text",
        input: {
          input: "The quick brown fox jumps over the lazy fox.",
          find: "fox",
          replace: "cat",
        },
        output: "The quick brown cat jumps over the lazy cat.",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
