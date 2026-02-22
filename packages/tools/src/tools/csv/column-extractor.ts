import { z } from "zod";
import { parse } from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string"),
});

const optionsSchema = z.object({
  columns: z
    .string()
    .default("0")
    .describe("Column names or indices to extract (comma-separated)"),
  delimiter: z.string().max(1).default(",").describe("Field delimiter"),
  includeHeader: z.boolean().default(true).describe("Include header row"),
});

const outputSchema = z.object({
  output: z.string().describe("CSV with extracted columns"),
  extractedColumns: z.array(z.string()).describe("Names of extracted columns"),
  rowCount: z.number().describe("Number of data rows"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Escape a CSV field.
 */
function escapeField(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Extracts specific columns from CSV.
 */
function execute(input: Input, options?: Options): Output {
  const columns = options?.columns ?? "0";
  const delimiter = options?.delimiter ?? ",";
  const includeHeader = options?.includeHeader ?? true;

  const result = parse<string[]>(input.input, {
    delimiter,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `CSV parse error: ${result.errors[0]?.message ?? "Unknown error"}`,
    });
  }

  const rows = result.data;
  if (rows.length === 0) {
    return { output: "", extractedColumns: [], rowCount: 0 };
  }

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);

  // Parse column specification
  const columnSpecs = columns.split(",").map((c) => c.trim());

  // Map column names/indices to indices
  const indices: number[] = [];
  const extractedNames: string[] = [];

  for (const spec of columnSpecs) {
    // Try as index first
    const idx = parseInt(spec, 10);
    if (!isNaN(idx) && idx >= 0 && idx < headers.length) {
      indices.push(idx);
      extractedNames.push(headers[idx] ?? `Column ${idx}`);
    } else {
      // Try as column name
      const headerIdx = headers.findIndex(
        (h) => h.toLowerCase() === spec.toLowerCase()
      );
      if (headerIdx !== -1) {
        indices.push(headerIdx);
        extractedNames.push(headers[headerIdx] ?? spec);
      }
    }
  }

  if (indices.length === 0) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `No matching columns found. Available columns: ${headers.join(", ")}`,
    });
  }

  // Extract columns
  const lines: string[] = [];

  if (includeHeader) {
    const headerRow = indices
      .map((i) => escapeField(headers[i] ?? "", delimiter))
      .join(delimiter);
    lines.push(headerRow);
  }

  for (const row of dataRows) {
    const extractedRow = indices
      .map((i) => escapeField(row[i] ?? "", delimiter))
      .join(delimiter);
    lines.push(extractedRow);
  }

  return {
    output: lines.join("\n"),
    extractedColumns: extractedNames,
    rowCount: dataRows.length,
  };
}

/**
 * CSV Column Extractor tool.
 * Extracts specific columns from CSV data.
 */
export const csvColumnExtractor = defineTool({
  meta: {
    id: "csv/column-extractor",
    name: "CSV Column Extractor",
    description:
      "Free online CSV column extractor — pull specific columns from CSV data by name or index instantly in your browser. No data is stored. Supports comma-separated column lists, case-insensitive matching, custom delimiters, and quoted fields.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "column",
      "extract",
      "select",
      "filter",
      "pick",
      "subset",
      "field",
      "spreadsheet",
    ],
    ui: { outputRenderer: "code" },
    examples: [
      {
        title: "Extract name and email from employee data",
        description:
          "Pull the name and email columns from a 3-row employee CSV",
        input:
          "name,email,department,salary\nAlice,alice@example.com,Engineering,95000\nBob,bob@example.com,Marketing,82000\nCarol,carol@example.com,Engineering,98000",
        options: { columns: "name,email" },
        output:
          '{"output":"name,email\\nAlice,alice@example.com\\nBob,bob@example.com\\nCarol,carol@example.com","extractedColumns":["name","email"],"rowCount":3}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
