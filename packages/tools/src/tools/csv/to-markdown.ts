import { z } from "zod";
import { parse } from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to convert to Markdown table"),
});

const optionsSchema = z.object({
  delimiter: z.string().max(1).default(",").describe("Field delimiter"),
  alignment: z
    .enum(["left", "center", "right", "auto"])
    .default("left")
    .describe("Column alignment"),
});

const outputSchema = z.object({
  output: z.string().describe("Markdown table"),
  rowCount: z.number().describe("Number of data rows"),
  columnCount: z.number().describe("Number of columns"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Escape markdown special characters in cell.
 */
function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

/**
 * Determine if a column contains numeric values.
 */
function isNumericColumn(values: string[]): boolean {
  const nonEmpty = values.filter((v) => v.trim() !== "");
  return nonEmpty.length > 0 && nonEmpty.every((v) => /^-?\d*\.?\d+$/.test(v));
}

/**
 * Converts CSV to Markdown table.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? ",";
  const alignment = options?.alignment ?? "left";

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
    return { output: "", rowCount: 0, columnCount: 0 };
  }

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);

  // Calculate column widths
  const widths = headers.map((h, i) => {
    const values = [h, ...dataRows.map((r) => r[i] ?? "")];
    return Math.max(...values.map((v) => escapeMarkdown(v).length), 3);
  });

  // Determine alignment for each column
  let alignments: string[];
  if (alignment === "auto") {
    alignments = headers.map((_, i) => {
      const values = dataRows.map((r) => r[i] ?? "");
      return isNumericColumn(values) ? "right" : "left";
    });
  } else {
    alignments = headers.map(() => alignment);
  }

  // Build separator row
  const separatorRow = widths
    .map((w, i) => {
      const align = alignments[i];
      if (align === "center") {
        return ":" + "-".repeat(w - 2) + ":";
      } else if (align === "right") {
        return "-".repeat(w - 1) + ":";
      } else {
        return ":" + "-".repeat(w - 1);
      }
    })
    .join(" | ");

  // Build header row
  const headerRow = headers
    .map((h, i) => escapeMarkdown(h).padEnd(widths[i] ?? 0))
    .join(" | ");

  // Build data rows
  const mdRows = dataRows.map((row) =>
    headers
      .map((_, i) => {
        const cell = escapeMarkdown(row[i] ?? "");
        const w = widths[i] ?? 0;
        return alignments[i] === "right" ? cell.padStart(w) : cell.padEnd(w);
      })
      .join(" | ")
  );

  const lines = [
    `| ${headerRow} |`,
    `| ${separatorRow} |`,
    ...mdRows.map((r) => `| ${r} |`),
  ];

  return {
    output: lines.join("\n"),
    rowCount: dataRows.length,
    columnCount: headers.length,
  };
}

/**
 * CSV to Markdown converter tool.
 * Converts CSV data to a Markdown table.
 */
export const csvToMarkdown = defineTool({
  meta: {
    id: "csv/to-markdown",
    name: "CSV to Markdown",
    description:
      "Free online CSV to Markdown table converter — transform CSV data into a formatted Markdown table instantly in your browser. No data is stored. Supports left/center/right/auto alignment, padded columns, and custom delimiters.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: ["csv", "markdown", "table", "convert", "md", "github", "readme"],
    ui: { outputRenderer: "code", outputLanguage: "markdown" },
    examples: [
      {
        title: "Employee table to Markdown",
        description:
          "Convert a 3-row CSV to a padded Markdown table with left-aligned columns",
        input:
          "name,age,department\nAlice,30,Engineering\nBob,25,Marketing\nCarol,35,Design",
        output:
          '{"output":"| name  | age | department  |\\n| :---- | :-- | :---------- |\\n| Alice | 30  | Engineering |\\n| Bob   | 25  | Marketing   |\\n| Carol | 35  | Design      |","rowCount":3,"columnCount":3}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
