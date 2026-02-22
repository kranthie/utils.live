import { z } from "zod";
import Papa from "papaparse";
import { XMLBuilder } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to convert to XML"),
});

const outputSchema = z.object({
  output: z.string().describe("XML string"),
  rowCount: z.number().describe("Number of rows"),
});

const optionsSchema = z.object({
  header: z.boolean().default(true).describe("First row contains headers"),
  delimiter: z.string().max(1).optional().describe("Column delimiter"),
  rootName: z.string().default("data").describe("Root element name"),
  rowName: z.string().default("row").describe("Row element name"),
  indent: z.string().default("  ").describe("Indentation string"),
  declaration: z.boolean().default(true).describe("Include XML declaration"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts CSV to XML format.
 */
function execute(input: Input, options?: Options): Output {
  const header = options?.header ?? true;
  const delimiter = options?.delimiter;
  const rootName = options?.rootName ?? "data";
  const rowName = options?.rowName ?? "row";
  const indent = options?.indent ?? "  ";
  const declaration = options?.declaration ?? true;

  try {
    const parseConfig: Papa.ParseConfig = {
      header,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().replace(/\s+/g, "_"),
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

    const builder = new XMLBuilder({
      format: true,
      indentBy: indent,
      arrayNodeName: rowName,
      suppressEmptyNode: false,
    });

    const xmlData = { [rootName]: { [rowName]: data } };
    let output = builder.build(xmlData);

    if (declaration) {
      output = `<?xml version="1.0" encoding="UTF-8"?>\n${output}`;
    }

    return {
      output: String(output).trim(),
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
 * CSV to XML tool.
 * Converts CSV to XML format.
 */
export const csvToXml = defineTool({
  meta: {
    id: "csv/to-xml",
    name: "CSV to XML",
    description:
      "Free online CSV to XML converter — transform CSV rows into XML elements with configurable root/row names instantly in your browser. No data is stored. Supports custom indentation, XML declaration, and dynamic type detection.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "xml",
      "convert",
      "transform",
      "element",
      "node",
      "serialization",
    ],
    ui: { outputRenderer: "code", outputLanguage: "xml" },
    examples: [
      {
        title: "Employee CSV to XML elements",
        description:
          "Convert a 2-row CSV to XML with <data> root and <row> elements",
        input: "name,age,department\nAlice,30,Engineering\nBob,25,Marketing",
        output:
          '{"output":"<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<data>\\n  <row>\\n    <name>Alice</name>\\n    <age>30</age>\\n    <department>Engineering</department>\\n  </row>\\n  <row>\\n    <name>Bob</name>\\n    <age>25</age>\\n    <department>Marketing</department>\\n  </row>\\n</data>","rowCount":2}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
