import { z } from "zod";
import Papa from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted CSV string"),
  rowCount: z.number().describe("Number of data rows"),
  columnCount: z.number().describe("Number of columns"),
});

const optionsSchema = z.object({
  delimiter: z.string().max(1).default(",").describe("Output column delimiter"),
  inputDelimiter: z
    .string()
    .max(1)
    .optional()
    .describe("Input delimiter (auto-detected if not specified)"),
  quotes: z.boolean().default(true).describe("Quote all fields"),
  header: z.boolean().default(true).describe("First row is header"),
  trimValues: z.boolean().default(true).describe("Trim whitespace from values"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Formats a CSV string.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? ",";
  const inputDelimiter = options?.inputDelimiter;
  const quotes = options?.quotes ?? true;
  const header = options?.header ?? true;
  const trimValues = options?.trimValues ?? true;

  try {
    const parseConfig: Papa.ParseConfig = {
      header,
      skipEmptyLines: true,
    };

    if (inputDelimiter) {
      parseConfig.delimiter = inputDelimiter;
    }

    if (trimValues) {
      parseConfig.transformHeader = (h: string) => h.trim();
      parseConfig.transform = (v: string) => v.trim();
    }

    const parseResult = Papa.parse(input.input, parseConfig);

    if (
      parseResult.errors.length > 0 &&
      parseResult.errors[0]?.type === "Delimiter"
    ) {
      throw new Error(parseResult.errors[0].message);
    }

    const data = parseResult.data as Record<string, string>[];

    const output = Papa.unparse(data, {
      delimiter,
      quotes,
      header,
    });

    const columnCount =
      header && data.length > 0 ? Object.keys(data[0] ?? {}).length : 0;

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
 * CSV Formatter tool.
 * Formats CSV with configurable delimiter and quoting.
 */
export const csvFormatter = defineTool({
  meta: {
    id: "csv/formatter",
    name: "CSV Formatter",
    description:
      "Free online CSV formatter — normalize and re-format CSV data with configurable quoting and delimiters instantly in your browser. No data is stored. Supports quote-all mode, value trimming, delimiter conversion, and auto-detection of input format.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "format",
      "delimiter",
      "quote",
      "normalize",
      "pretty",
      "clean",
    ],
    ui: { outputRenderer: "code" },
    examples: [
      {
        title: "Quote all fields in employee CSV",
        description:
          "Wrap every field in double quotes for consistent quoting style",
        input: "name,age,city\nAlice,30,Portland\nBob,25,Seattle",
        output:
          '{"output":"\\"name\\",\\"age\\",\\"city\\"\\r\\n\\"Alice\\",\\"30\\",\\"Portland\\"\\r\\n\\"Bob\\",\\"25\\",\\"Seattle\\"","rowCount":2,"columnCount":3}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
