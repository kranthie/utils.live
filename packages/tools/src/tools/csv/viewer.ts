import { z } from "zod";
import { parse } from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to view"),
});

const optionsSchema = z.object({
  delimiter: z.string().max(1).default(",").describe("Field delimiter"),
  limit: z.number().min(1).max(1000).default(100).describe("Max rows to show"),
  showLineNumbers: z.boolean().default(true).describe("Show line numbers"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted table view"),
  rowCount: z.number().describe("Total number of rows"),
  columnCount: z.number().describe("Number of columns"),
  columns: z.array(z.string()).describe("Column headers"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Format CSV as a readable table.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? ",";
  const limit = options?.limit ?? 100;
  const showLineNumbers = options?.showLineNumbers ?? true;

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
    return {
      output: "(empty)",
      rowCount: 0,
      columnCount: 0,
      columns: [],
    };
  }

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1, limit + 1);
  const totalRows = rows.length - 1;

  // Calculate column widths
  const widths = headers.map((h, i) => {
    const values = [h, ...dataRows.map((r) => r[i] ?? "")];
    return Math.max(...values.map((v) => String(v).length));
  });

  // Build table
  const lines: string[] = [];
  const lineNumWidth = showLineNumbers
    ? String(Math.min(totalRows, limit)).length + 2
    : 0;

  // Header row
  const headerLine = headers
    .map((h, i) => String(h).padEnd(widths[i] ?? 0))
    .join(" | ");
  if (showLineNumbers) {
    lines.push(" ".repeat(lineNumWidth) + "| " + headerLine);
  } else {
    lines.push(headerLine);
  }

  // Separator
  const separator = widths.map((w) => "-".repeat(w)).join("-+-");
  if (showLineNumbers) {
    lines.push("-".repeat(lineNumWidth) + "+-" + separator);
  } else {
    lines.push(separator);
  }

  // Data rows
  dataRows.forEach((row, index) => {
    const dataLine = headers
      .map((_, i) => String(row[i] ?? "").padEnd(widths[i] ?? 0))
      .join(" | ");
    if (showLineNumbers) {
      lines.push(
        String(index + 1).padStart(lineNumWidth - 1) + " | " + dataLine
      );
    } else {
      lines.push(dataLine);
    }
  });

  // Truncation notice
  if (totalRows > limit) {
    lines.push(`\n... (${totalRows - limit} more rows)`);
  }

  return {
    output: lines.join("\n"),
    rowCount: totalRows,
    columnCount: headers.length,
    columns: headers,
  };
}

/**
 * CSV Viewer tool.
 * Displays CSV data as a formatted table.
 */
export const csvViewer = defineTool({
  meta: {
    id: "csv/viewer",
    name: "CSV Viewer",
    description:
      "Free online CSV viewer — display CSV data as a formatted, aligned table instantly in your browser. No data is stored. Supports line numbers, column alignment, row limits, and custom delimiters.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "view",
      "table",
      "display",
      "format",
      "pretty",
      "print",
      "preview",
    ],
    ui: { outputRenderer: "code" },
    examples: [
      {
        title: "View employee CSV as aligned table",
        description:
          "Display a 2-row CSV with line numbers and padded column alignment",
        input: "name,age,city\nAlice,30,Portland\nBob,25,Seattle",
        output:
          '{"output":"   | name  | age | city    \\n---+-------+-----+---------\\n 1 | Alice | 30  | Portland\\n 2 | Bob   | 25  | Seattle ","rowCount":2,"columnCount":3,"columns":["name","age","city"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
