import { z } from "zod";
import { parse } from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to convert to TSV"),
});

const optionsSchema = z.object({
  inputDelimiter: z.string().max(1).default(",").describe("Input delimiter"),
  escapeMode: z
    .enum(["escape", "remove", "space"])
    .default("escape")
    .describe("How to handle tabs in values"),
});

const outputSchema = z.object({
  output: z.string().describe("TSV string"),
  rowCount: z.number().describe("Number of rows"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Handle tab characters in value.
 */
function handleTabs(value: string, mode: string): string {
  switch (mode) {
    case "escape":
      return value.replace(/\t/g, "\\t");
    case "remove":
      return value.replace(/\t/g, "");
    case "space":
      return value.replace(/\t/g, " ");
    default:
      return value;
  }
}

/**
 * Converts CSV to TSV (tab-separated values).
 */
function execute(input: Input, options?: Options): Output {
  const inputDelimiter = options?.inputDelimiter ?? ",";
  const escapeMode = options?.escapeMode ?? "escape";

  const result = parse<string[]>(input.input, {
    delimiter: inputDelimiter,
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
    return { output: "", rowCount: 0 };
  }

  const lines = rows.map((row) =>
    row.map((cell) => handleTabs(cell, escapeMode)).join("\t")
  );

  return {
    output: lines.join("\n"),
    rowCount: rows.length,
  };
}

/**
 * CSV to TSV converter tool.
 * Converts CSV to tab-separated values.
 */
export const csvToTsv = defineTool({
  meta: {
    id: "csv/to-tsv",
    name: "CSV to TSV",
    description:
      "Free online CSV to TSV converter — convert comma-separated values to tab-separated values instantly in your browser. No data is stored. Handles embedded tabs via escape, remove, or space replacement modes.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "tsv",
      "convert",
      "tab",
      "separated",
      "spreadsheet",
      "clipboard",
    ],
    ui: { outputRenderer: "code" },
    examples: [
      {
        title: "Convert employee CSV to TSV",
        description:
          "Replace comma delimiters with tabs for spreadsheet pasting",
        input: "name,age,department\nAlice,30,Engineering\nBob,25,Marketing",
        output:
          '{"output":"name\\tage\\tdepartment\\nAlice\\t30\\tEngineering\\nBob\\t25\\tMarketing","rowCount":3}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
