import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to filter"),
});

const outputSchema = z.object({
  output: z.string().describe("Filtered CSV string"),
  originalCount: z.number().describe("Original row count"),
  filteredCount: z.number().describe("Rows after filtering"),
});

const optionsSchema = z.object({
  filter: z
    .string()
    .default("age > 0")
    .describe(
      "Filter expression (e.g., 'age > 30', 'name == \"John\"', 'city contains York')"
    ),
  header: z.boolean().default(true).describe("First row is header"),
  delimiter: z.string().max(1).default(",").describe("Column delimiter"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Parses and evaluates a simple filter expression.
 */
function evaluateFilter(row: Record<string, unknown>, filter: string): boolean {
  // Parse simple expressions: column op value
  // Supports: ==, !=, >, <, >=, <=, contains, startsWith, endsWith

  const patterns = [
    /^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/,
    /^(\w+)\s+(contains|startsWith|endsWith)\s+(.+)$/i,
  ];

  let match: RegExpMatchArray | null = null;
  for (const pattern of patterns) {
    match = filter.trim().match(pattern);
    if (match) break;
  }

  if (!match) {
    return true; // Invalid filter, include all
  }

  const column = match[1] ?? "";
  const operator = match[2] ?? "";
  const rawValue = match[3] ?? "";

  const cellValue = row[column];

  // Parse value (handle quotes)
  let value: string | number = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  } else if (!isNaN(Number(value))) {
    value = Number(value);
  }

  const cellStr =
    cellValue == null
      ? ""
      : typeof cellValue === "object"
        ? JSON.stringify(cellValue)
        : String(cellValue as string | number | boolean);
  const cellNum = Number(cellValue);
  const valNum = typeof value === "number" ? value : Number(value);

  switch (operator.toLowerCase()) {
    case "==":
      return cellValue == value || cellStr === String(value);
    case "!=":
      return cellValue != value && cellStr !== String(value);
    case ">":
      return !isNaN(cellNum) && !isNaN(valNum) && cellNum > valNum;
    case "<":
      return !isNaN(cellNum) && !isNaN(valNum) && cellNum < valNum;
    case ">=":
      return !isNaN(cellNum) && !isNaN(valNum) && cellNum >= valNum;
    case "<=":
      return !isNaN(cellNum) && !isNaN(valNum) && cellNum <= valNum;
    case "contains":
      return cellStr.toLowerCase().includes(String(value).toLowerCase());
    case "startswith":
      return cellStr.toLowerCase().startsWith(String(value).toLowerCase());
    case "endswith":
      return cellStr.toLowerCase().endsWith(String(value).toLowerCase());
    default:
      return true;
  }
}

/**
 * Filters CSV rows based on expression.
 */
function execute(input: Input, options?: Options): Output {
  const filter = options?.filter ?? "age > 0";
  const header = options?.header ?? true;
  const delimiter = options?.delimiter ?? ",";

  try {
    const parseConfig: Papa.ParseConfig = {
      header,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimiter,
    };

    const parseResult = Papa.parse(input.input, parseConfig);
    const data = parseResult.data as Record<string, unknown>[];

    const originalCount = data.length;
    const filtered = data.filter((row) => evaluateFilter(row, filter));

    const output = Papa.unparse(filtered, {
      delimiter,
      header,
    });

    return {
      output,
      originalCount,
      filteredCount: filtered.length,
    };
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * CSV Filter tool.
 * Filters CSV rows based on expressions.
 */
export const csvFilter = defineTool({
  meta: {
    id: "csv/filter",
    name: "CSV Filter",
    description:
      "Free online CSV filter — filter rows by column conditions instantly in your browser. No data is stored. Supports comparison operators (==, !=, >, <, >=, <=), string matching (contains, startsWith, endsWith), and custom delimiters.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "filter",
      "query",
      "where",
      "select",
      "condition",
      "search",
      "rows",
    ],
    ui: { outputRenderer: "code" },
    examples: [
      {
        title: "Filter employees with salary above 80k",
        description:
          "Keep only rows where the salary column is greater than 80000",
        input:
          "name,age,department,salary\nAlice,32,Engineering,95000\nBob,25,Marketing,62000\nCarol,41,Engineering,110000\nDave,28,Sales,58000",
        options: { filter: "salary > 80000" },
        output:
          '{"output":"name,age,department,salary\\r\\nAlice,32,Engineering,95000\\r\\nCarol,41,Engineering,110000","originalCount":4,"filteredCount":2}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
