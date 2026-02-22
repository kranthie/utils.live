import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to sort"),
});

const outputSchema = z.object({
  output: z.string().describe("Sorted CSV string"),
  rowCount: z.number().describe("Number of rows"),
});

const optionsSchema = z.object({
  column: z.string().default("name").describe("Column to sort by"),
  order: z.enum(["asc", "desc"]).default("asc").describe("Sort order"),
  numeric: z.boolean().default(false).describe("Sort as numbers"),
  header: z.boolean().default(true).describe("First row is header"),
  delimiter: z.string().max(1).default(",").describe("Column delimiter"),
  caseInsensitive: z.boolean().default(false).describe("Case-insensitive sort"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Sorts CSV rows by column.
 */
function execute(input: Input, options?: Options): Output {
  const column = options?.column;
  const order = options?.order ?? "asc";
  const numeric = options?.numeric ?? false;
  const header = options?.header ?? true;
  const delimiter = options?.delimiter ?? ",";
  const caseInsensitive = options?.caseInsensitive ?? false;

  if (!column) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: "Column is required for sorting",
    });
  }

  try {
    const parseResult = Papa.parse<Record<string, unknown>>(input.input, {
      header,
      delimiter,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    const sorted = [...parseResult.data].sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      // Handle undefined/null
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      let result: number;

      if (numeric) {
        const numA = Number(valA);
        const numB = Number(valB);
        if (isNaN(numA) && isNaN(numB)) result = 0;
        else if (isNaN(numA)) result = 1;
        else if (isNaN(numB)) result = -1;
        else result = numA - numB;
      } else {
        let strA = String(valA);
        let strB = String(valB);

        if (caseInsensitive) {
          strA = strA.toLowerCase();
          strB = strB.toLowerCase();
        }

        result = strA.localeCompare(strB);
      }

      return order === "desc" ? -result : result;
    });

    const output = Papa.unparse(sorted, {
      delimiter,
      header,
    });

    return {
      output,
      rowCount: sorted.length,
    };
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * CSV Sort tool.
 * Sorts CSV rows by column.
 */
export const csvSort = defineTool({
  meta: {
    id: "csv/sort",
    name: "CSV Sort",
    description:
      "Free online CSV sorter — sort rows by any column instantly in your browser. No data is stored. Supports ascending/descending order, numeric sorting, case-insensitive comparison, and custom delimiters.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "sort",
      "order",
      "arrange",
      "ascending",
      "descending",
      "rank",
    ],
    ui: { outputRenderer: "code" },
    examples: [
      {
        title: "Sort employees by age (numeric ascending)",
        description: "Sort a 3-row CSV numerically by the age column",
        input:
          "name,age,department\nCarol,35,Design\nAlice,30,Engineering\nBob,25,Marketing",
        options: { column: "age", numeric: true },
        output:
          '{"output":"name,age,department\\r\\nBob,25,Marketing\\r\\nAlice,30,Engineering\\r\\nCarol,35,Design","rowCount":3}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
