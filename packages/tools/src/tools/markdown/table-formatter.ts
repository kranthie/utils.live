import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const alignmentEnum = z.enum(["left", "center", "right"]);

const inputSchema = z.object({
  input: z.string().describe("Markdown string containing tables to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted markdown with aligned tables"),
  tablesFormatted: z.number().describe("Number of tables formatted"),
});

const optionsSchema = z.object({
  alignment: z
    .array(alignmentEnum)
    .optional()
    .describe("Column alignment to apply (overrides existing)"),
  padding: z
    .number()
    .int()
    .min(0)
    .max(4)
    .default(1)
    .describe("Spaces of padding around cell content"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Alignment = z.infer<typeof alignmentEnum>;

interface ParsedTable {
  startIndex: number;
  endIndex: number;
  headers: string[];
  separators: string[];
  rows: string[][];
  alignments: Alignment[];
}

/**
 * Parses alignment from separator cell.
 */
function parseAlignment(separator: string): Alignment {
  const trimmed = separator.trim();
  const hasLeft = trimmed.startsWith(":");
  const hasRight = trimmed.endsWith(":");

  if (hasLeft && hasRight) return "center";
  if (hasRight) return "right";
  return "left";
}

/**
 * Creates separator string based on alignment and width.
 */
function createSeparator(
  alignment: Alignment,
  width: number,
  padding: number
): string {
  const pad = " ".repeat(padding);

  switch (alignment) {
    case "left": {
      const dashes = "-".repeat(Math.max(2, width - 1));
      return `${pad}:${dashes}${pad}`;
    }
    case "center": {
      const dashes = "-".repeat(Math.max(1, width - 2));
      return `${pad}:${dashes}:${pad}`;
    }
    case "right": {
      const dashes = "-".repeat(Math.max(2, width - 1));
      return `${pad}${dashes}:${pad}`;
    }
  }
}

/**
 * Pads cell content to specified width.
 */
function padCell(
  content: string,
  width: number,
  alignment: Alignment,
  padding: number
): string {
  const pad = " ".repeat(padding);
  const totalWidth = width;
  const contentLen = content.length;
  const spacesNeeded = totalWidth - contentLen;

  if (spacesNeeded <= 0) {
    return `${pad}${content}${pad}`;
  }

  switch (alignment) {
    case "left":
      return `${pad}${content}${" ".repeat(spacesNeeded)}${pad}`;
    case "right":
      return `${pad}${" ".repeat(spacesNeeded)}${content}${pad}`;
    case "center": {
      const leftSpaces = Math.floor(spacesNeeded / 2);
      const rightSpaces = spacesNeeded - leftSpaces;
      return `${pad}${" ".repeat(leftSpaces)}${content}${" ".repeat(rightSpaces)}${pad}`;
    }
  }
}

/**
 * Parses a markdown table from lines.
 */
function parseTable(lines: string[], startLine: number): ParsedTable | null {
  // Need at least 2 lines for a valid table (header + separator)
  if (startLine + 1 >= lines.length) return null;

  const headerLine = lines[startLine];
  const separatorLine = lines[startLine + 1];

  // Check if this looks like a table
  if (!headerLine?.includes("|") || !separatorLine?.includes("|")) {
    return null;
  }

  // Check separator line has proper format (dashes with optional colons)
  const separatorPattern = /^\|?[\s:|-]+\|?$/;
  if (!separatorPattern.test(separatorLine)) {
    return null;
  }

  // Parse header cells
  const headers = headerLine
    .split("|")
    .map((cell) => cell.trim())
    .filter(
      (_, i, arr) =>
        (i > 0 && i < arr.length - 1) || (arr.length === 1 && _ !== "")
    );

  if (headers.length === 0) return null;

  // Parse separator and alignment
  const separators = separatorLine
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.match(/^:?-+:?$/));

  if (separators.length === 0) return null;

  const alignments = separators.map(parseAlignment);

  // Parse data rows
  const rows: string[][] = [];
  let endIndex = startLine + 2;

  while (endIndex < lines.length) {
    const line = lines[endIndex];
    if (!line?.includes("|")) break;

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(
        (_, i, arr) =>
          (i > 0 && i < arr.length - 1) || (arr.length === 1 && _ !== "")
      );

    if (cells.length === 0) break;

    rows.push(cells);
    endIndex++;
  }

  return {
    startIndex: startLine,
    endIndex: endIndex - 1,
    headers,
    separators,
    rows,
    alignments,
  };
}

/**
 * Formats a parsed table with proper alignment and padding.
 */
function formatTable(table: ParsedTable, options: Options): string[] {
  const { headers, rows, alignments } = table;
  const padding = options.padding ?? 1;

  // Determine column count
  const columnCount = Math.max(
    headers.length,
    ...rows.map((row) => row.length)
  );

  // Apply custom alignments if provided
  const finalAlignments: Alignment[] = [];
  for (let i = 0; i < columnCount; i++) {
    finalAlignments.push(options.alignment?.[i] ?? alignments[i] ?? "left");
  }

  // Calculate column widths
  const widths: number[] = [];
  for (let i = 0; i < columnCount; i++) {
    const headerWidth = (headers[i] ?? "").length;
    const maxRowWidth = Math.max(
      0,
      ...rows.map((row) => (row[i] ?? "").length)
    );
    widths.push(Math.max(3, headerWidth, maxRowWidth));
  }

  // Format header row
  const headerCells = [];
  for (let i = 0; i < columnCount; i++) {
    const width = widths[i] ?? 3;
    const alignment = finalAlignments[i] ?? "left";
    headerCells.push(padCell(headers[i] ?? "", width, alignment, padding));
  }
  const headerRow = `|${headerCells.join("|")}|`;

  // Format separator row
  const separatorCells = [];
  for (let i = 0; i < columnCount; i++) {
    const width = widths[i] ?? 3;
    const alignment = finalAlignments[i] ?? "left";
    separatorCells.push(createSeparator(alignment, width, padding));
  }
  const separatorRow = `|${separatorCells.join("|")}|`;

  // Format data rows
  const dataRows = rows.map((row) => {
    const cells = [];
    for (let i = 0; i < columnCount; i++) {
      const width = widths[i] ?? 3;
      const alignment = finalAlignments[i] ?? "left";
      cells.push(padCell(row[i] ?? "", width, alignment, padding));
    }
    return `|${cells.join("|")}|`;
  });

  return [headerRow, separatorRow, ...dataRows];
}

/**
 * Formats markdown tables in the input string.
 */
function execute(input: Input, options?: Options): Output {
  const lines = input.input.split("\n");
  const opts: Options = {
    padding: options?.padding ?? 1,
    alignment: options?.alignment,
  };

  const result: string[] = [];
  let tablesFormatted = 0;
  let i = 0;

  while (i < lines.length) {
    const table = parseTable(lines, i);

    if (table) {
      const formatted = formatTable(table, opts);
      result.push(...formatted);
      tablesFormatted++;
      i = table.endIndex + 1;
    } else {
      result.push(lines[i] ?? "");
      i++;
    }
  }

  return {
    output: result.join("\n"),
    tablesFormatted,
  };
}

/**
 * Markdown Table Formatter tool.
 * Formats and aligns existing markdown tables.
 */
export const markdownTableFormatter = defineTool({
  meta: {
    id: "markdown/table-formatter",
    name: "Markdown Table Formatter",
    description:
      "Free online Markdown table formatter — align columns, normalize padding, and set left/center/right alignment on existing Markdown tables instantly in your browser. No data is stored. Automatically calculates column widths and formats separator rows.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "table", "format", "align", "prettify", "md"],
    examples: [
      {
        title: "Format a messy Markdown table",
        description: "Align columns in an unformatted Markdown table",
        input: "| Name | Age |\n|---|---|\n| Alice | 30 |\n| Bob | 25 |",
        output:
          "| Name  | Age |\n| :----- | :--- |\n| Alice | 30  |\n| Bob   | 25  |",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
