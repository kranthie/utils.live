import { z } from "zod";
import { parse } from "papaparse";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { CSV_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("CSV string to convert to SQL"),
});

const optionsSchema = z.object({
  tableName: z.string().default("data").describe("SQL table name"),
  delimiter: z.string().max(1).default(",").describe("Field delimiter"),
  includeCreate: z.boolean().default(true).describe("Include CREATE TABLE"),
  batchSize: z
    .number()
    .min(1)
    .max(1000)
    .default(100)
    .describe("INSERT batch size"),
});

const outputSchema = z.object({
  output: z.string().describe("SQL statements"),
  rowCount: z.number().describe("Number of rows"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Escape a SQL string value.
 * Handles single quotes (standard SQL) and backslashes (MySQL compatibility).
 * Also strips null bytes which can cause issues in some SQL engines.
 */
function escapeSQL(value: string): string {
  return value
    .replace(/\0/g, "") // strip null bytes
    .replace(/\\/g, "\\\\") // escape backslashes (MySQL compatibility)
    .replace(/'/g, "''"); // escape single quotes (standard SQL)
}

/**
 * Infer SQL type from values.
 */
function inferType(values: string[]): string {
  const nonEmpty = values.filter((v) => v.trim() !== "");
  if (nonEmpty.length === 0) return "TEXT";

  // Check if all values are integers
  if (nonEmpty.every((v) => /^-?\d+$/.test(v))) {
    return "INTEGER";
  }

  // Check if all values are numbers
  if (nonEmpty.every((v) => /^-?\d*\.?\d+$/.test(v))) {
    return "REAL";
  }

  // Check max length for VARCHAR
  const maxLen = Math.max(...nonEmpty.map((v) => v.length));
  if (maxLen <= 255) {
    return `VARCHAR(${Math.max(maxLen, 50)})`;
  }

  return "TEXT";
}

/**
 * Sanitize a SQL table name: strip everything except [a-zA-Z0-9_],
 * replace spaces with underscores, and fall back to "data" if empty.
 */
function sanitizeTableName(name: string): string {
  const sanitized = name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return sanitized || "data";
}

/**
 * Converts CSV to SQL INSERT statements.
 */
function execute(input: Input, options?: Options): Output {
  const rawTableName = options?.tableName ?? "data";
  const tableName = sanitizeTableName(rawTableName);
  const delimiter = options?.delimiter ?? ",";
  const includeCreate = options?.includeCreate ?? true;
  const batchSize = options?.batchSize ?? 100;

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
    return { output: "", rowCount: 0 };
  }

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);
  const lines: string[] = [];

  // CREATE TABLE statement
  if (includeCreate) {
    const columnValues: string[][] = headers.map((_, i) =>
      dataRows.map((row) => row[i] ?? "")
    );

    const columnDefs = headers.map((header, i) => {
      const safeName = header.replace(/[^a-zA-Z0-9_]/g, "_");
      const type = inferType(columnValues[i] ?? []);
      return `  ${safeName} ${type}`;
    });

    lines.push(`CREATE TABLE \`${tableName}\` (`);
    lines.push(columnDefs.join(",\n"));
    lines.push(");\n");
  }

  // INSERT statements
  const safeHeaders = headers.map((h) => h.replace(/[^a-zA-Z0-9_]/g, "_"));
  const columnList = safeHeaders.join(", ");

  for (let i = 0; i < dataRows.length; i += batchSize) {
    const batch = dataRows.slice(i, i + batchSize);
    const values = batch.map((row) => {
      const rowValues = headers.map((_, j) => {
        const val = row[j] ?? "";
        // Check if it's a number
        if (/^-?\d*\.?\d+$/.test(val) && val !== "") {
          return val;
        }
        return `'${escapeSQL(val)}'`;
      });
      return `(${rowValues.join(", ")})`;
    });

    lines.push(`INSERT INTO \`${tableName}\` (${columnList}) VALUES`);
    lines.push(values.join(",\n") + ";");
    lines.push("");
  }

  return {
    output: lines.join("\n"),
    rowCount: dataRows.length,
  };
}

/**
 * CSV to SQL converter tool.
 * Converts CSV data to SQL INSERT statements.
 */
export const csvToSql = defineTool({
  meta: {
    id: "csv/to-sql",
    name: "CSV to SQL",
    description:
      "Free online CSV to SQL converter — generate CREATE TABLE and INSERT statements from CSV data instantly in your browser. No data is stored. Auto-detects column types (INTEGER, REAL, VARCHAR, TEXT), supports batch inserts and custom table names.",
    category: "csv",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "sql",
      "convert",
      "database",
      "insert",
      "create",
      "table",
      "mysql",
      "postgres",
    ],
    ui: { outputRenderer: "code", outputLanguage: "sql" },
    examples: [
      {
        title: "Employee CSV to SQL with CREATE TABLE",
        description:
          "Generate CREATE TABLE + INSERT statements from a 2-row employee CSV",
        input: "name,age,salary\nAlice,30,95000\nBob,25,62000",
        options: { tableName: "employees" },
        output:
          '{"output":"CREATE TABLE `employees` (\\n  name VARCHAR(50),\\n  age INTEGER,\\n  salary INTEGER\\n);\\n\\nINSERT INTO `employees` (name, age, salary) VALUES\\n(\'Alice\', 30, 95000),\\n(\'Bob\', 25, 62000);\\n","rowCount":2}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
