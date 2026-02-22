import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input1: z.string().describe("First CSV string"),
  input2: z.string().describe("Second CSV string"),
});

const outputSchema = z.object({
  output: z.string().describe("Merged CSV string"),
  rowCount: z.number().describe("Total number of rows"),
  columnCount: z.number().describe("Number of columns"),
});

const optionsSchema = z.object({
  header: z.boolean().default(true).describe("First row is header"),
  delimiter: z.string().max(1).default(",").describe("Column delimiter"),
  strategy: z
    .enum(["append", "union", "join"])
    .default("append")
    .describe("Merge strategy"),
  joinColumn: z
    .string()
    .optional()
    .describe("Column to join on (for join strategy)"),
  deduplicateRows: z.boolean().default(false).describe("Remove duplicate rows"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Merges two CSV files.
 */
function execute(input: Input, options?: Options): Output {
  const header = options?.header ?? true;
  const delimiter = options?.delimiter ?? ",";
  const strategy = options?.strategy ?? "append";
  const joinColumn = options?.joinColumn;
  const deduplicateRows = options?.deduplicateRows ?? false;

  const parseConfig: Papa.ParseConfig = {
    header,
    skipEmptyLines: true,
    delimiter,
  };

  let data1: Record<string, unknown>[];
  let data2: Record<string, unknown>[];

  try {
    const result1 = Papa.parse(input.input1, parseConfig);
    data1 = result1.data as Record<string, unknown>[];
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV in first input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  try {
    const result2 = Papa.parse(input.input2, parseConfig);
    data2 = result2.data as Record<string, unknown>[];
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV in second input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  let merged: Record<string, unknown>[];

  switch (strategy) {
    case "append":
      // Simple concatenation
      merged = [...data1, ...data2];
      break;

    case "union": {
      // Combine columns from both CSVs
      const cols1 = data1.length > 0 && data1[0] ? Object.keys(data1[0]) : [];
      const cols2 = data2.length > 0 && data2[0] ? Object.keys(data2[0]) : [];
      const allColumns = new Set([...cols1, ...cols2]);

      merged = [
        ...data1.map((row) => {
          const newRow: Record<string, unknown> = {};
          for (const col of allColumns) {
            newRow[col] = row[col] ?? "";
          }
          return newRow;
        }),
        ...data2.map((row) => {
          const newRow: Record<string, unknown> = {};
          for (const col of allColumns) {
            newRow[col] = row[col] ?? "";
          }
          return newRow;
        }),
      ];
      break;
    }

    case "join": {
      if (!joinColumn) {
        throw createToolError({
          code: CSV_PARSE_ERROR,
          message: "joinColumn is required for join strategy",
        });
      }

      const map2 = new Map(data2.map((row) => [String(row[joinColumn]), row]));

      merged = data1.map((row1) => {
        const key = String(row1[joinColumn]);
        const row2 = map2.get(key);
        return row2 ? { ...row1, ...row2 } : row1;
      });

      // Add rows from data2 that don't exist in data1
      const keys1 = new Set(data1.map((row) => String(row[joinColumn])));
      for (const [key, row2] of map2) {
        if (!keys1.has(key)) {
          merged.push(row2);
        }
      }
      break;
    }
  }

  // Deduplicate if requested
  if (deduplicateRows) {
    const seen = new Set<string>();
    merged = merged.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const output = Papa.unparse(merged, {
    delimiter,
    header,
  });

  const columnCount =
    merged.length > 0 && merged[0] ? Object.keys(merged[0]).length : 0;

  return {
    output,
    rowCount: merged.length,
    columnCount,
  };
}

/**
 * CSV Merge tool.
 * Merges two CSV files with configurable strategies.
 */
export const csvMerge = defineTool({
  meta: {
    id: "csv/merge",
    name: "CSV Merge",
    description:
      "Free online CSV merge tool — combine two CSV files into one instantly in your browser. No data is stored. Supports append, union (different columns), and join strategies with optional deduplication.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "merge",
      "combine",
      "join",
      "concat",
      "append",
      "union",
      "deduplicate",
    ],
    ui: { outputRenderer: "code" },
    examples: [
      {
        title: "Append two user lists",
        description:
          "Concatenate two CSV files with the same columns into one combined file",
        input: {
          input1:
            "id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com",
          input2:
            "id,name,email\n3,Carol,carol@example.com\n4,Dave,dave@example.com",
        },
        output:
          '{"output":"id,name,email\\r\\n1,Alice,alice@example.com\\r\\n2,Bob,bob@example.com\\r\\n3,Carol,carol@example.com\\r\\n4,Dave,dave@example.com","rowCount":4,"columnCount":3}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
