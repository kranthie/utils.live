import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const alignmentEnum = z.enum(["left", "center", "right"]);

const inputSchema = z.object({
  headers: z.array(z.string()).min(1).describe("Table header row"),
  rows: z.array(z.array(z.string())).describe("Table data rows (2D array)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated markdown table"),
  rowCount: z.number().describe("Number of data rows"),
  columnCount: z.number().describe("Number of columns"),
});

const optionsSchema = z.object({
  alignment: z
    .array(alignmentEnum)
    .optional()
    .describe("Column alignment (left/center/right for each column)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Alignment = z.infer<typeof alignmentEnum>;

/**
 * Creates separator line for markdown table based on alignment.
 */
function createSeparator(columnCount: number, alignment?: Alignment[]): string {
  const separators: string[] = [];

  for (let i = 0; i < columnCount; i++) {
    const align = alignment?.[i] ?? "left";
    switch (align) {
      case "left":
        separators.push(":---");
        break;
      case "center":
        separators.push(":---:");
        break;
      case "right":
        separators.push("---:");
        break;
    }
  }

  return `| ${separators.join(" | ")} |`;
}

/**
 * Escapes pipe characters in cell content.
 */
function escapeCell(content: string): string {
  return content.replace(/\|/g, "\\|");
}

/**
 * Creates a row line for markdown table.
 */
function createRow(cells: string[], columnCount: number): string {
  const paddedCells: string[] = [];

  for (let i = 0; i < columnCount; i++) {
    paddedCells.push(escapeCell(cells[i] ?? ""));
  }

  return `| ${paddedCells.join(" | ")} |`;
}

/**
 * Generates a markdown table from headers and rows.
 */
function execute(input: Input, options?: Options): Output {
  const { headers, rows } = input;
  const columnCount = headers.length;

  const lines: string[] = [];

  // Header row
  lines.push(createRow(headers, columnCount));

  // Separator row
  lines.push(createSeparator(columnCount, options?.alignment));

  // Data rows
  for (const row of rows) {
    lines.push(createRow(row, columnCount));
  }

  return {
    output: lines.join("\n"),
    rowCount: rows.length,
    columnCount,
  };
}

/**
 * Markdown Table Generator tool.
 * Generates a markdown table from an array of headers and rows.
 */
export const markdownTableGenerator = defineTool({
  meta: {
    id: "markdown/table-generator",
    name: "Markdown Table Generator",
    description:
      "Free online Markdown table generator — create formatted Markdown tables from headers and data rows instantly in your browser. No data is stored. Supports left, center, and right column alignment with proper separator rows and pipe escaping.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "table", "generate", "create", "md"],
    examples: [
      {
        title: "Generate a Markdown table",
        description: "Create a formatted Markdown table from data",
        input: {
          headers: ["Name", "Role"],
          rows: [
            ["Alice", "Engineer"],
            ["Bob", "Designer"],
          ],
        },
        output:
          "| Name | Role |\n| :--- | :--- |\n| Alice | Engineer |\n| Bob | Designer |",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
