import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text with lines to sort"),
});

const outputSchema = z.object({
  output: z.string().describe("Sorted text"),
  lineCount: z.number().describe("Number of lines"),
});

const optionsSchema = z.object({
  order: z.enum(["asc", "desc"]).default("asc").describe("Sort order"),
  sortBy: z
    .enum(["alphabetical", "numeric", "length", "natural"])
    .default("alphabetical")
    .describe("Sort method"),
  caseSensitive: z.boolean().default(false).describe("Case-sensitive sorting"),
  trimLines: z.boolean().default(true).describe("Trim whitespace from lines"),
  ignoreEmpty: z.boolean().default(false).describe("Ignore empty lines"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Sorts lines of text.
 */
function execute(input: Input, options?: Options): Output {
  const order = options?.order ?? "asc";
  const sortBy = options?.sortBy ?? "alphabetical";
  const caseSensitive = options?.caseSensitive ?? false;
  const trimLines = options?.trimLines ?? true;
  const ignoreEmpty = options?.ignoreEmpty ?? false;

  let lines = input.input.split(/\r?\n/);

  if (trimLines) {
    lines = lines.map((line) => line.trim());
  }

  if (ignoreEmpty) {
    lines = lines.filter((line) => line.length > 0);
  }

  const compareFn = (a: string, b: string): number => {
    const aVal = caseSensitive ? a : a.toLowerCase();
    const bVal = caseSensitive ? b : b.toLowerCase();

    let result: number;

    switch (sortBy) {
      case "numeric": {
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        const aIsNum = !isNaN(aNum);
        const bIsNum = !isNaN(bNum);
        if (aIsNum && bIsNum) {
          result = aNum - bNum;
        } else if (aIsNum) {
          result = -1; // numbers first
        } else if (bIsNum) {
          result = 1;
        } else {
          result = aVal.localeCompare(bVal); // both non-numeric: alphabetical
        }
        break;
      }
      case "length":
        result = a.length - b.length;
        break;
      case "natural":
        result = naturalCompare(aVal, bVal);
        break;
      case "alphabetical":
      default:
        result = aVal.localeCompare(bVal);
    }

    return order === "desc" ? -result : result;
  };

  const sorted = [...lines].sort(compareFn);

  return {
    output: sorted.join("\n"),
    lineCount: sorted.length,
  };
}

/**
 * Line Sorter tool.
 * Sorts lines alphabetically, numerically, or by length.
 */
export const lineSorter = defineTool({
  meta: {
    id: "text/line-sorter",
    name: "Line Sorter",
    description:
      "Free online line sorter — sort lines of text alphabetically, numerically, naturally, or by length instantly in your browser. No data is stored. Supports ascending/descending order, case sensitivity, and empty line filtering.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["sort", "lines", "order", "alphabetical", "numeric"],
    examples: [
      {
        title: "Alphabetical Sort",
        description: "Sort a list of fruits alphabetically",
        input: "banana\napple\ncherry\ndate\navocado",
        output: "apple\navocado\nbanana\ncherry\ndate",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
