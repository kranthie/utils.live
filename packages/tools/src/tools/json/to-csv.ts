import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR, INPUT_INVALID_FORMAT } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON array to convert to CSV"),
});

const outputSchema = z.object({
  output: z.string().describe("CSV string"),
  rowCount: z.number().describe("Number of data rows"),
  columnCount: z.number().describe("Number of columns"),
});

const optionsSchema = z.object({
  delimiter: z.string().max(1).default(",").describe("Column delimiter"),
  header: z.boolean().default(true).describe("Include header row"),
  quotes: z.boolean().default(true).describe("Quote all fields"),
  newline: z.enum(["LF", "CRLF"]).default("LF").describe("Newline character"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts JSON array to CSV format.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? ",";
  const header = options?.header ?? true;
  const quotes = options?.quotes ?? true;
  const newline = options?.newline === "CRLF" ? "\r\n" : "\n";

  try {
    const parsed: unknown = JSON.parse(input.input);

    if (!Array.isArray(parsed)) {
      throw createToolError({
        code: INPUT_INVALID_FORMAT,
        message: "Input must be a JSON array of objects",
      });
    }

    if (parsed.length === 0) {
      return {
        output: "",
        rowCount: 0,
        columnCount: 0,
      };
    }

    // Flatten nested objects for CSV
    const flattened = parsed.map((item: unknown) => {
      if (typeof item !== "object" || item === null) {
        return { value: item };
      }
      return flattenForCsv(item as Record<string, unknown>);
    });

    const output = Papa.unparse(flattened, {
      delimiter,
      header,
      quotes,
      newline,
    });

    const firstRow = flattened[0];
    const columnCount =
      flattened.length > 0 && firstRow ? Object.keys(firstRow).length : 0;

    return {
      output,
      rowCount: flattened.length,
      columnCount,
    };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) {
      throw err;
    }
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

function flattenForCsv(
  obj: Record<string, unknown>,
  prefix: string = ""
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenForCsv(value as Record<string, unknown>, newKey)
      );
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * JSON to CSV tool.
 * Converts JSON array to CSV format.
 */
export const jsonToCsv = defineTool({
  meta: {
    id: "json/to-csv",
    name: "JSON to CSV",
    description:
      "Free online JSON to CSV converter — convert a JSON array of objects to CSV format instantly in your browser. No data is stored. Configurable delimiter, quoting, and header row.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "csv", "convert", "transform", "spreadsheet", "excel"],
    examples: [
      {
        title: "Array of Objects",
        description: "Convert a JSON array of user objects to CSV format",
        input:
          '[{"name": "Alice", "age": 30, "city": "Portland"}, {"name": "Bob", "age": 25, "city": "Seattle"}]',
        output:
          '"name","age","city"\n"Alice","30","Portland"\n"Bob","25","Seattle"',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
