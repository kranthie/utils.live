import { z } from "zod";
import { XMLParser } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { XML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("XML string to convert to CSV"),
});

const optionsSchema = z.object({
  delimiter: z.string().max(1).default(",").describe("Field delimiter"),
  rowPath: z
    .string()
    .optional()
    .describe("XPath-like path to row elements (e.g., 'root.items.item')"),
  includeHeader: z.boolean().default(true).describe("Include header row"),
});

const outputSchema = z.object({
  output: z.string().describe("CSV string"),
  rowCount: z.number().describe("Number of rows"),
  columnCount: z.number().describe("Number of columns"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Get value at a path in an object.
 */
function getAtPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Find arrays in the parsed XML to use as rows.
 */
function findArrays(
  obj: unknown,
  path = ""
): Array<{ path: string; items: unknown[] }> {
  const results: Array<{ path: string; items: unknown[] }> = [];

  if (Array.isArray(obj)) {
    results.push({ path, items: obj });
  } else if (typeof obj === "object" && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      results.push(...findArrays(value, newPath));
    }
  }

  return results;
}

/**
 * Escape a CSV field value.
 */
function escapeField(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "object"
      ? JSON.stringify(value)
      : String(value as string | number | boolean);
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts XML to CSV.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? ",";
  const rowPath = options?.rowPath;
  const includeHeader = options?.includeHeader ?? true;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  let parsed: unknown;
  try {
    parsed = parser.parse(input.input);
  } catch (err) {
    throw createToolError({
      code: XML_PARSE_ERROR,
      message: `Invalid XML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  // Find the array to use as rows
  let rows: unknown[];
  if (rowPath) {
    const data = getAtPath(parsed, rowPath);
    if (!Array.isArray(data)) {
      throw createToolError({
        code: XML_PARSE_ERROR,
        message: `Path "${rowPath}" does not point to an array`,
      });
    }
    rows = data;
  } else {
    // Auto-detect: find the first array
    const arrays = findArrays(parsed);
    const firstArray = arrays[0];
    if (!firstArray) {
      throw createToolError({
        code: XML_PARSE_ERROR,
        message: "No arrays found in XML. Specify rowPath option.",
      });
    }
    rows = firstArray.items;
  }

  if (rows.length === 0) {
    return { output: "", rowCount: 0, columnCount: 0 };
  }

  // Extract all unique keys from all rows
  const allKeys = new Set<string>();
  for (const row of rows) {
    if (typeof row === "object" && row !== null) {
      Object.keys(row).forEach((key) => allKeys.add(key));
    }
  }

  const columns = Array.from(allKeys);
  const csvLines: string[] = [];

  // Header row
  if (includeHeader) {
    csvLines.push(
      columns.map((col) => escapeField(col, delimiter)).join(delimiter)
    );
  }

  // Data rows
  for (const row of rows) {
    if (typeof row === "object" && row !== null) {
      const values = columns.map((col) =>
        escapeField((row as Record<string, unknown>)[col], delimiter)
      );
      csvLines.push(values.join(delimiter));
    }
  }

  return {
    output: csvLines.join("\n"),
    rowCount: rows.length,
    columnCount: columns.length,
  };
}

/**
 * XML to CSV converter tool.
 * Converts XML data to CSV format.
 */
export const xmlToCsv = defineTool({
  meta: {
    id: "xml/to-csv",
    name: "XML to CSV",
    description:
      "Free online XML to CSV converter — extract tabular data from XML documents instantly in your browser. No data is stored. Auto-detects repeating elements, supports custom delimiters and XPath-like row selection.",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "csv",
      "convert",
      "transform",
      "spreadsheet",
      "export",
      "table",
      "extract",
    ],
    examples: [
      {
        title: "Employee list XML to CSV",
        description:
          "Extract employee records from XML into a comma-separated table with headers",
        input:
          "<employees>\n  <employee>\n    <name>Alice Johnson</name>\n    <department>Engineering</department>\n    <salary>95000</salary>\n  </employee>\n  <employee>\n    <name>Bob Smith</name>\n    <department>Marketing</department>\n    <salary>78000</salary>\n  </employee>\n  <employee>\n    <name>Carol Davis</name>\n    <department>Engineering</department>\n    <salary>102000</salary>\n  </employee>\n</employees>",
        output:
          "name,department,salary\nAlice Johnson,Engineering,95000\nBob Smith,Marketing,78000\nCarol Davis,Engineering,102000",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
