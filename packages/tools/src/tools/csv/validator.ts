import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CSV string to validate"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the CSV is valid"),
  errors: z
    .array(
      z.object({
        type: z.string(),
        code: z.string(),
        message: z.string(),
        row: z.number().optional(),
      })
    )
    .describe("Parse errors if any"),
  rowCount: z.number().describe("Number of data rows"),
  columnCount: z.number().describe("Number of columns (from first row)"),
  hasConsistentColumns: z
    .boolean()
    .describe("Whether all rows have same column count"),
});

const optionsSchema = z.object({
  header: z.boolean().default(true).describe("First row is header"),
  delimiter: z
    .string()
    .max(1)
    .optional()
    .describe("Column delimiter (auto-detected if not specified)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Validates a CSV string.
 */
function execute(input: Input, options?: Options): Output {
  const header = options?.header ?? true;
  const delimiter = options?.delimiter;

  const parseConfig: Papa.ParseConfig = {
    header: false,
    skipEmptyLines: true,
  };

  if (delimiter) {
    parseConfig.delimiter = delimiter;
  }

  const parseResult = Papa.parse(input.input, parseConfig);
  const rows = parseResult.data as string[][];

  const errors = parseResult.errors.map((err) => ({
    type: err.type,
    code: err.code,
    message: err.message,
    row: err.row,
  }));

  const rowCount = header ? rows.length - 1 : rows.length;
  const columnCount = rows.length > 0 && rows[0] ? rows[0].length : 0;

  // Check column consistency
  const hasConsistentColumns = rows.every((row) => row.length === columnCount);

  if (!hasConsistentColumns) {
    const inconsistentRows = rows
      .map((row, i) => ({ index: i, cols: row.length }))
      .filter((r) => r.cols !== columnCount);

    for (const r of inconsistentRows.slice(0, 5)) {
      errors.push({
        type: "FieldMismatch",
        code: "TooFewFields",
        message: `Row ${r.index + 1} has ${r.cols} columns, expected ${columnCount}`,
        row: r.index,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    rowCount: Math.max(0, rowCount),
    columnCount,
    hasConsistentColumns,
  };
}

/**
 * CSV Validator tool.
 * Validates CSV structure and syntax.
 */
export const csvValidator = defineTool({
  meta: {
    id: "csv/validator",
    name: "CSV Validator",
    description:
      "Free online CSV validator — check CSV structure, column consistency, and syntax errors instantly in your browser. No data is stored. Detects mismatched column counts, malformed fields, and reports row-level error details.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "validate",
      "syntax",
      "check",
      "lint",
      "structure",
      "columns",
      "parse",
    ],
    ui: { outputRenderer: "json-tree" },
    examples: [
      {
        title: "Validate a well-formed employee CSV",
        description:
          "Check a 3-column, 2-row CSV for structural validity and column consistency",
        input: "name,age,city\nAlice,30,Portland\nBob,25,Seattle",
        output:
          '{"valid":true,"errors":[],"rowCount":2,"columnCount":3,"hasConsistentColumns":true}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
