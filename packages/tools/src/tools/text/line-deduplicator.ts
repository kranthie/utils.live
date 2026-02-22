import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text with potential duplicate lines"),
});

const outputSchema = z.object({
  output: z.string().describe("Text with duplicates removed"),
  originalCount: z.number().describe("Original line count"),
  uniqueCount: z.number().describe("Unique line count"),
  duplicatesRemoved: z.number().describe("Number of duplicates removed"),
});

const optionsSchema = z.object({
  caseSensitive: z
    .boolean()
    .default(true)
    .describe("Treat lines as case-sensitive"),
  trimLines: z.boolean().default(true).describe("Trim whitespace from lines"),
  preserveOrder: z.boolean().default(true).describe("Preserve original order"),
  ignoreEmpty: z.boolean().default(false).describe("Ignore empty lines"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Removes duplicate lines from text.
 */
function execute(input: Input, options?: Options): Output {
  const caseSensitive = options?.caseSensitive ?? true;
  const trimLines = options?.trimLines ?? true;
  const preserveOrder = options?.preserveOrder ?? true;
  const ignoreEmpty = options?.ignoreEmpty ?? false;

  let lines = input.input.split(/\r?\n/);
  const originalCount = lines.length;

  if (trimLines) {
    lines = lines.map((line) => line.trim());
  }

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const line of lines) {
    if (ignoreEmpty && line.length === 0) {
      continue;
    }

    const key = caseSensitive ? line : line.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(line);
    }
  }

  const result = preserveOrder
    ? unique
    : [...unique].sort((a, b) => a.localeCompare(b));

  return {
    output: result.join("\n"),
    originalCount,
    uniqueCount: unique.length,
    duplicatesRemoved: originalCount - unique.length,
  };
}

/**
 * Line Deduplicator tool.
 * Removes duplicate lines from text.
 */
export const lineDeduplicator = defineTool({
  meta: {
    id: "text/line-deduplicator",
    name: "Line Deduplicator",
    description:
      "Free online line deduplicator — remove duplicate lines from text instantly in your browser. No data is stored. Supports case-sensitive matching, whitespace trimming, and order preservation.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["deduplicate", "unique", "lines", "remove", "duplicate"],
    examples: [
      {
        title: "Remove Duplicates",
        description: "Remove repeated lines from a list while preserving order",
        input: "apple\nbanana\napple\ncherry\nbanana\ndate",
        output: "apple\nbanana\ncherry\ndate",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
