import { z } from "zod";
import { parse } from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to deduplicate"),
});

const optionsSchema = z.object({
  delimiter: z.string().max(1).default(",").describe("Field delimiter"),
  keyColumns: z
    .array(z.string())
    .optional()
    .describe("Columns to use as duplicate key (all columns if not specified)"),
  keepFirst: z
    .boolean()
    .default(true)
    .describe("Keep first occurrence (false = keep last)"),
});

const outputSchema = z.object({
  output: z.string().describe("Deduplicated CSV"),
  originalCount: z.number().describe("Original row count"),
  uniqueCount: z.number().describe("Unique row count"),
  duplicatesRemoved: z.number().describe("Number of duplicates removed"),
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
 * Deduplicates CSV rows.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? ",";
  const keyColumns = options?.keyColumns;
  const keepFirst = options?.keepFirst ?? true;

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
      output: "",
      originalCount: 0,
      uniqueCount: 0,
      duplicatesRemoved: 0,
    };
  }

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);

  // Determine key column indices
  let keyIndices: number[];
  if (keyColumns && keyColumns.length > 0) {
    keyIndices = keyColumns
      .map((col) => {
        const idx = headers.findIndex(
          (h) => h.toLowerCase() === col.toLowerCase()
        );
        return idx;
      })
      .filter((idx) => idx !== -1);
  } else {
    keyIndices = headers.map((_, i) => i);
  }

  // Build unique set
  const seen = new Map<string, number>();
  const uniqueIndices: number[] = [];

  dataRows.forEach((row, index) => {
    const key = keyIndices.map((i) => row[i] ?? "").join("\0");

    if (!seen.has(key)) {
      // First encounter: always record the index
      seen.set(key, index);
      uniqueIndices.push(index);
    } else if (!keepFirst) {
      // Duplicate with keep-last strategy: replace previous index with this one
      const prevIdx = uniqueIndices.indexOf(seen.get(key)!);
      if (prevIdx !== -1) {
        uniqueIndices[prevIdx] = index;
      }
      seen.set(key, index);
    }
    // keepFirst=true and key already seen: skip (original index stays)
  });

  if (!keepFirst) {
    uniqueIndices.sort((a, b) => a - b);
  }

  // Build output
  const lines: string[] = [];
  lines.push(headers.map((h) => escapeField(h, delimiter)).join(delimiter));

  for (const idx of uniqueIndices) {
    const row = dataRows[idx];
    if (row) {
      lines.push(row.map((v) => escapeField(v, delimiter)).join(delimiter));
    }
  }

  return {
    output: lines.join("\n"),
    originalCount: dataRows.length,
    uniqueCount: uniqueIndices.length,
    duplicatesRemoved: dataRows.length - uniqueIndices.length,
  };
}

/**
 * CSV Deduplicator tool.
 * Removes duplicate rows from CSV data.
 */
export const csvDeduplicator = defineTool({
  meta: {
    id: "csv/deduplicator",
    name: "CSV Deduplicator",
    description:
      "Free online CSV deduplicator — remove duplicate rows from CSV data instantly in your browser. No data is stored. Supports key-column matching, keep-first or keep-last strategies, custom delimiters, and quoted fields.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "deduplicate",
      "unique",
      "remove",
      "duplicates",
      "distinct",
      "rows",
      "clean",
    ],
    ui: { outputRenderer: "code" },
    examples: [
      {
        title: "Remove exact duplicate rows from user data",
        description:
          "Deduplicate a CSV with one fully repeated row (alice@example.com appears twice)",
        input:
          "email,name,plan\nalice@example.com,Alice,pro\nbob@example.com,Bob,free\ncharlie@example.com,Charlie,pro\nalice@example.com,Alice,pro\nbob@example.com,Bob,enterprise",
        output:
          '{"output":"email,name,plan\\nalice@example.com,Alice,pro\\nbob@example.com,Bob,free\\ncharlie@example.com,Charlie,pro\\nbob@example.com,Bob,enterprise","originalCount":5,"uniqueCount":4,"duplicatesRemoved":1}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
