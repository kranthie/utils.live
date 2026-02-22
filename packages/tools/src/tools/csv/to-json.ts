import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to convert to JSON"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON array string"),
  rowCount: z.number().describe("Number of rows"),
  columnCount: z.number().describe("Number of columns"),
});

const optionsSchema = z.object({
  header: z.boolean().default(true).describe("First row contains headers"),
  delimiter: z.string().max(1).optional().describe("Column delimiter"),
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("JSON indentation"),
  dynamicTyping: z
    .boolean()
    .default(true)
    .describe("Convert numbers and booleans"),
  skipEmptyLines: z.boolean().default(true).describe("Skip empty lines"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts CSV to JSON array.
 */
function execute(input: Input, options?: Options): Output {
  const header = options?.header ?? true;
  const delimiter = options?.delimiter;
  const indent = options?.indent ?? 2;
  const dynamicTyping = options?.dynamicTyping ?? true;
  const skipEmptyLines = options?.skipEmptyLines ?? true;

  try {
    const parseConfig: Papa.ParseConfig = {
      header,
      dynamicTyping,
      skipEmptyLines,
      transformHeader: (h: string) => h.trim(),
      transform: (v: string) => v.trim(),
    };

    if (delimiter) {
      parseConfig.delimiter = delimiter;
    }

    const parseResult = Papa.parse(input.input, parseConfig);

    if (parseResult.errors.length > 0) {
      const firstError = parseResult.errors[0];
      if (firstError && firstError.type !== "FieldMismatch") {
        throw new Error(firstError.message);
      }
    }

    const data = parseResult.data as Record<string, unknown>[];
    const output = JSON.stringify(data, null, indent);
    const columnCount =
      header && data.length > 0 && data[0] ? Object.keys(data[0]).length : 0;

    return {
      output,
      rowCount: data.length,
      columnCount,
    };
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * CSV to JSON tool.
 * Converts CSV to JSON array format.
 */
export const csvToJson = defineTool({
  meta: {
    id: "csv/to-json",
    name: "CSV to JSON",
    description:
      "Free online CSV to JSON converter — transform CSV data into a JSON array of objects instantly in your browser. No data is stored. Auto-detects numbers and booleans, supports custom delimiters and configurable indentation.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "json",
      "convert",
      "transform",
      "array",
      "object",
      "api",
      "parser",
    ],
    ui: { outputRenderer: "code", outputLanguage: "json" },
    examples: [
      {
        title: "Employee table to JSON array",
        description:
          "Convert a 3-row CSV with headers to a JSON array of objects with auto-typed numbers",
        input:
          "name,age,department\nAlice,30,Engineering\nBob,25,Marketing\nCarol,35,Design",
        output:
          '{"output":"[\\n  {\\n    \\"name\\": \\"Alice\\",\\n    \\"age\\": 30,\\n    \\"department\\": \\"Engineering\\"\\n  },\\n  {\\n    \\"name\\": \\"Bob\\",\\n    \\"age\\": 25,\\n    \\"department\\": \\"Marketing\\"\\n  },\\n  {\\n    \\"name\\": \\"Carol\\",\\n    \\"age\\": 35,\\n    \\"department\\": \\"Design\\"\\n  }\\n]","rowCount":3,"columnCount":3}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
