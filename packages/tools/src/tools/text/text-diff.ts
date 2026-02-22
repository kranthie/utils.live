import { z } from "zod";
import * as diff from "diff";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("First text"),
  input2: z.string().describe("Second text"),
});

const outputSchema = z.object({
  identical: z.boolean().describe("Whether texts are identical"),
  changes: z
    .array(
      z.object({
        type: z.enum(["added", "removed", "unchanged"]),
        value: z.string(),
        count: z.number().optional(),
      })
    )
    .describe("List of changes"),
  stats: z.object({
    additions: z.number(),
    deletions: z.number(),
    unchanged: z.number(),
  }),
});

const optionsSchema = z.object({
  ignoreWhitespace: z
    .boolean()
    .default(false)
    .describe("Ignore whitespace changes"),
  ignoreCase: z
    .boolean()
    .default(false)
    .describe("Case-insensitive comparison"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Compares two texts and shows differences.
 */
function execute(input: Input, options?: Options): Output {
  const ignoreWhitespace = options?.ignoreWhitespace ?? false;
  const ignoreCase = options?.ignoreCase ?? false;

  let text1 = input.input1;
  let text2 = input.input2;

  if (ignoreCase) {
    text1 = text1.toLowerCase();
    text2 = text2.toLowerCase();
  }

  if (ignoreWhitespace) {
    text1 = text1.replace(/\s+/g, " ").trim();
    text2 = text2.replace(/\s+/g, " ").trim();
  }

  const changes = diff.diffWords(text1, text2);

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  const formattedChanges = changes.map((change) => {
    const wordCount = change.value
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    if (change.added) {
      additions += wordCount;
      return { type: "added" as const, value: change.value, count: wordCount };
    } else if (change.removed) {
      deletions += wordCount;
      return {
        type: "removed" as const,
        value: change.value,
        count: wordCount,
      };
    } else {
      unchanged += wordCount;
      return {
        type: "unchanged" as const,
        value: change.value,
        count: wordCount,
      };
    }
  });

  return {
    identical: additions === 0 && deletions === 0,
    changes: formattedChanges,
    stats: {
      additions,
      deletions,
      unchanged,
    },
  };
}

/**
 * Text Diff tool.
 * Side-by-side text comparison.
 */
export const textDiff = defineTool({
  meta: {
    id: "text/diff",
    name: "Text Diff",
    description:
      "Free online text diff tool — compare two texts and highlight word-level differences instantly in your browser. No data is stored. Supports whitespace-insensitive and case-insensitive comparison modes.",
    category: "text",
    subgroup: "Comparison",
    tier: ToolTier.CLIENT,
    keywords: ["diff", "compare", "difference", "changes", "text"],
    examples: [
      {
        title: "Compare two sentences",
        description: "Show word-level differences between two texts",
        input: { input1: "The quick brown fox", input2: "The slow brown cat" },
        output:
          '{"identical":false,"changes":[{"type":"unchanged","value":"The ","count":1},{"type":"removed","value":"quick","count":1},{"type":"added","value":"slow","count":1},{"type":"unchanged","value":" brown ","count":1},{"type":"removed","value":"fox","count":1},{"type":"added","value":"cat","count":1}],"stats":{"additions":2,"deletions":2,"unchanged":2}}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
