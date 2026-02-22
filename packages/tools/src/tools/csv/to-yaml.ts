import { z } from "zod";
import Papa from "papaparse";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to convert to YAML"),
});

const outputSchema = z.object({
  output: z.string().describe("YAML string"),
  rowCount: z.number().describe("Number of rows"),
});

const optionsSchema = z.object({
  header: z.boolean().default(true).describe("First row contains headers"),
  delimiter: z.string().max(1).optional().describe("Column delimiter"),
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("YAML indentation"),
  dynamicTyping: z
    .boolean()
    .default(true)
    .describe("Convert numbers and booleans"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts CSV to YAML format.
 */
function execute(input: Input, options?: Options): Output {
  const header = options?.header ?? true;
  const delimiter = options?.delimiter;
  const indent = options?.indent ?? 2;
  const dynamicTyping = options?.dynamicTyping ?? true;

  try {
    const parseConfig: Papa.ParseConfig = {
      header,
      dynamicTyping,
      skipEmptyLines: true,
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
    const output = yaml.dump(data, {
      indent,
      noRefs: true,
    });

    return {
      output,
      rowCount: data.length,
    };
  } catch (err) {
    throw createToolError({
      code: CSV_PARSE_ERROR,
      message: `Invalid CSV: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * CSV to YAML tool.
 * Converts CSV to YAML format.
 */
export const csvToYaml = defineTool({
  meta: {
    id: "csv/to-yaml",
    name: "CSV to YAML",
    description:
      "Free online CSV to YAML converter — transform CSV data into a YAML array of objects instantly in your browser. No data is stored. Auto-detects numbers and booleans, supports custom indentation and delimiters.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: ["csv", "yaml", "convert", "transform", "config", "data"],
    ui: { outputRenderer: "code", outputLanguage: "yaml" },
    examples: [
      {
        title: "Employee CSV to YAML array",
        description:
          "Convert a 2-row CSV to a YAML list with auto-typed numeric values",
        input: "name,age,department\nAlice,30,Engineering\nBob,25,Marketing",
        output:
          '{"output":"- name: Alice\\n  age: 30\\n  department: Engineering\\n- name: Bob\\n  age: 25\\n  department: Marketing\\n","rowCount":2}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
