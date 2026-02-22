import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to analyze"),
});

const outputSchema = z.object({
  rowCount: z.number().describe("Number of data rows"),
  columnCount: z.number().describe("Number of columns"),
  columns: z.array(
    z.object({
      name: z.string(),
      type: z
        .string()
        .describe("Detected type: number, string, boolean, mixed"),
      uniqueCount: z.number(),
      nullCount: z.number(),
      minValue: z.unknown().optional(),
      maxValue: z.unknown().optional(),
      mean: z.number().optional(),
      median: z.number().optional(),
    })
  ),
  sizeBytes: z.number().describe("Size in bytes"),
});

const optionsSchema = z.object({
  header: z.boolean().default(true).describe("First row is header"),
  delimiter: z.string().max(1).optional().describe("Column delimiter"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface ColumnStats {
  name: string;
  type: string;
  uniqueCount: number;
  nullCount: number;
  minValue?: unknown;
  maxValue?: unknown;
  mean?: number;
  median?: number;
}

function detectType(values: unknown[]): string {
  const nonNull = values.filter(
    (v) => v !== null && v !== undefined && v !== ""
  );
  if (nonNull.length === 0) return "string";

  const types = new Set<string>();
  for (const v of nonNull) {
    if (typeof v === "number") types.add("number");
    else if (typeof v === "boolean") types.add("boolean");
    else if (typeof v === "string" && !isNaN(Number(v)) && v.trim() !== "")
      types.add("number");
    else types.add("string");
  }

  if (types.size === 1) {
    const firstType = types.values().next().value;
    return typeof firstType === "string" ? firstType : "string";
  }
  if (types.has("number") && types.size === 1) return "number";
  return "mixed";
}

function calculateStats(column: string, values: unknown[]): ColumnStats {
  const nonNull = values.filter(
    (v) => v !== null && v !== undefined && v !== ""
  );
  const unique = new Set(values.map((v) => JSON.stringify(v)));
  const nullCount = values.length - nonNull.length;
  const type = detectType(values);

  const stats: ColumnStats = {
    name: column,
    type,
    uniqueCount: unique.size,
    nullCount,
  };

  if (
    type === "number" ||
    (type === "mixed" && nonNull.some((v) => typeof v === "number"))
  ) {
    const numbers = nonNull
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((n) => !isNaN(n));

    if (numbers.length > 0) {
      stats.minValue = Math.min(...numbers);
      stats.maxValue = Math.max(...numbers);
      stats.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;

      // Calculate median
      const sorted = [...numbers].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const midVal = sorted[mid];
      const prevMidVal = sorted[mid - 1];
      if (
        sorted.length % 2 === 0 &&
        prevMidVal !== undefined &&
        midVal !== undefined
      ) {
        stats.median = (prevMidVal + midVal) / 2;
      } else if (midVal !== undefined) {
        stats.median = midVal;
      }
    }
  } else if (type === "string") {
    const strings = nonNull.map(String);
    if (strings.length > 0) {
      const sorted = [...strings].sort();
      stats.minValue = sorted[0];
      stats.maxValue = sorted[sorted.length - 1];
    }
  }

  return stats;
}

/**
 * Calculates statistics for a CSV file.
 */
function execute(input: Input, options?: Options): Output {
  const header = options?.header ?? true;
  const delimiter = options?.delimiter;

  try {
    const parseConfig: Papa.ParseConfig = {
      header,
      dynamicTyping: true,
      skipEmptyLines: true,
    };

    if (delimiter) {
      parseConfig.delimiter = delimiter;
    }

    const parseResult = Papa.parse(input.input, parseConfig);
    const data = parseResult.data as Record<string, unknown>[];
    const columnNames = data.length > 0 && data[0] ? Object.keys(data[0]) : [];

    const columns = columnNames.map((col) => {
      const values = data.map((row) => row[col]);
      return calculateStats(col, values);
    });

    const sizeBytes = new TextEncoder().encode(input.input).length;

    return {
      rowCount: data.length,
      columnCount: columnNames.length,
      columns,
      sizeBytes,
    };
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * CSV Stats tool.
 * Calculates statistics for CSV data.
 */
export const csvStats = defineTool({
  meta: {
    id: "csv/stats",
    name: "CSV Statistics",
    description:
      "Free online CSV statistics calculator — analyze column types, min/max, mean, median, and unique counts instantly in your browser. No data is stored. Auto-detects numeric vs string columns and computes per-column summary statistics.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "stats",
      "statistics",
      "analyze",
      "summary",
      "mean",
      "median",
      "min",
      "max",
    ],
    ui: { outputRenderer: "json-tree" },
    examples: [
      {
        title: "Analyze employee CSV with numeric columns",
        description:
          "Compute statistics for a 4-row CSV — detects age and salary as numeric, calculates mean and median",
        input:
          "name,age,salary\nAlice,30,95000\nBob,25,62000\nCarol,41,110000\nDave,28,58000",
        output:
          '{"rowCount":4,"columnCount":3,"columns":[{"name":"name","type":"string","uniqueCount":4,"nullCount":0,"minValue":"Alice","maxValue":"Dave"},{"name":"age","type":"number","uniqueCount":4,"nullCount":0,"minValue":25,"maxValue":41,"mean":31,"median":29},{"name":"salary","type":"number","uniqueCount":4,"nullCount":0,"minValue":58000,"maxValue":110000,"mean":81250,"median":78500}],"sizeBytes":73}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
