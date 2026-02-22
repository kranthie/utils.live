import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text with columns to align"),
});

const outputSchema = z.object({
  output: z.string().describe("Aligned text"),
  columnCount: z.number().describe("Number of columns detected"),
});

const optionsSchema = z.object({
  delimiter: z.string().default("|").describe("Column delimiter"),
  alignment: z
    .enum(["left", "right", "center"])
    .default("left")
    .describe("Alignment direction"),
  padding: z
    .number()
    .int()
    .min(0)
    .max(10)
    .default(1)
    .describe("Padding between columns"),
  outputDelimiter: z
    .string()
    .optional()
    .describe("Output delimiter (default: same as input)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function alignText(
  text: string,
  width: number,
  alignment: "left" | "right" | "center"
): string {
  if (text.length >= width) {
    return text;
  }

  const padding = width - text.length;

  switch (alignment) {
    case "right":
      return " ".repeat(padding) + text;
    case "center": {
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return " ".repeat(leftPad) + text + " ".repeat(rightPad);
    }
    case "left":
    default:
      return text + " ".repeat(padding);
  }
}

/**
 * Aligns text in columns.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? "|";
  const alignment = options?.alignment ?? "left";
  const padding = options?.padding ?? 1;
  const outputDelimiter = options?.outputDelimiter ?? delimiter;

  const lines = input.input.split(/\r?\n/);

  // Split lines into columns
  const rows = lines.map((line) =>
    line.split(delimiter).map((cell) => cell.trim())
  );

  // Find max column count and column widths
  let maxColumns = 0;
  const columnWidths: number[] = [];

  for (const row of rows) {
    maxColumns = Math.max(maxColumns, row.length);
    row.forEach((cell, i) => {
      columnWidths[i] = Math.max(columnWidths[i] || 0, cell.length);
    });
  }

  // Align each row
  const aligned = rows.map((row) => {
    const cells = row.map((cell, i) => {
      const width = columnWidths[i] ?? cell.length;
      return alignText(cell, width, alignment);
    });

    // Pad missing columns
    while (cells.length < maxColumns) {
      const width = columnWidths[cells.length] ?? 0;
      cells.push(" ".repeat(width));
    }

    return cells.join(
      " ".repeat(padding) + outputDelimiter + " ".repeat(padding)
    );
  });

  return {
    output: aligned.join("\n"),
    columnCount: maxColumns,
  };
}

/**
 * Column Aligner tool.
 * Aligns text in columns.
 */
export const columnAligner = defineTool({
  meta: {
    id: "text/column-aligner",
    name: "Column Aligner",
    description:
      "Free online column aligner — align delimited text into evenly spaced columns instantly in your browser. No data is stored. Supports custom delimiters, left/right/center alignment, and adjustable padding.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["column", "align", "table", "format", "grid"],
    examples: [
      {
        title: "Align pipe-delimited data",
        description: "Align columns in a pipe-separated table",
        input: "Name|Age|City\nAlice|30|New York\nBob|25|San Francisco",
        output:
          "Name  | Age | City         \nAlice | 30  | New York     \nBob   | 25  | San Francisco",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
