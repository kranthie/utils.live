import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL CREATE TABLE statements"),
});

const optionsSchema = z.object({
  exportTypes: z.boolean().default(true).describe("Export all types"),
  nullableOptional: z
    .boolean()
    .default(true)
    .describe("Make nullable columns optional"),
  camelCase: z
    .boolean()
    .default(true)
    .describe("Convert column names to camelCase"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated TypeScript interfaces"),
});

function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
}

function toPascalCase(s: string): string {
  const camel = toCamelCase(s);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function sqlTypeToTs(sqlType: string): string {
  const upper = sqlType
    .toUpperCase()
    .replace(/\(.*\)/, "")
    .trim();
  switch (upper) {
    case "INT":
    case "INTEGER":
    case "SMALLINT":
    case "TINYINT":
    case "MEDIUMINT":
    case "BIGINT":
    case "SERIAL":
    case "BIGSERIAL":
    case "FLOAT":
    case "DOUBLE":
    case "DECIMAL":
    case "NUMERIC":
    case "REAL":
    case "DOUBLE PRECISION":
    case "MONEY":
    case "SMALLMONEY":
      return "number";
    case "BOOLEAN":
    case "BOOL":
    case "BIT":
      return "boolean";
    case "DATE":
    case "DATETIME":
    case "DATETIME2":
    case "TIMESTAMP":
    case "TIMESTAMPTZ":
    case "TIME":
    case "TIMETZ":
      return "Date";
    case "JSON":
    case "JSONB":
      return "Record<string, unknown>";
    case "UUID":
      return "string";
    case "BYTEA":
    case "BLOB":
    case "BINARY":
    case "VARBINARY":
    case "LONGBLOB":
    case "MEDIUMBLOB":
    case "TINYBLOB":
      return "Buffer";
    case "ARRAY":
      return "unknown[]";
    default:
      // VARCHAR, CHAR, TEXT, etc.
      return "string";
  }
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const exportKw = (options?.exportTypes ?? true) ? "export " : "";
  const useCamelCase = options?.camelCase ?? true;
  const nullableOptional = options?.nullableOptional ?? true;

  // Parse CREATE TABLE statements
  const tableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|")?(\w+)(?:`|")?\s*\(([\s\S]*?)\)\s*;/gi;
  const results: string[] = [
    "// Generated from SQL CREATE TABLE statements",
    "",
  ];

  let match;
  let found = false;

  while ((match = tableRegex.exec(text)) !== null) {
    found = true;
    const tableName = match[1];
    const body = match[2];
    const interfaceName = toPascalCase(tableName!);

    const fields: string[] = [];
    const lines = body!
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      // Skip constraints
      const upperLine = line.toUpperCase().trim();
      if (
        upperLine.startsWith("PRIMARY KEY") ||
        upperLine.startsWith("FOREIGN KEY") ||
        upperLine.startsWith("UNIQUE") ||
        upperLine.startsWith("INDEX") ||
        upperLine.startsWith("CONSTRAINT") ||
        upperLine.startsWith("CHECK")
      ) {
        continue;
      }

      // Parse column: name TYPE [NOT NULL] [DEFAULT ...]
      const colMatch = line.match(
        /^(?:`|")?(\w+)(?:`|")?\s+(\w+(?:\([^)]*\))?)/i
      );
      if (!colMatch) continue;

      const colName = colMatch[1]!;
      const sqlType = colMatch[2]!;
      const isNotNull = /NOT\s+NULL/i.test(line);
      const isPrimaryKey = /PRIMARY\s+KEY/i.test(line);
      const hasDefault = /DEFAULT/i.test(line);
      const isAutoIncrement = /AUTO_INCREMENT|SERIAL|GENERATED/i.test(line);

      const tsType = sqlTypeToTs(sqlType);
      const fieldName = useCamelCase ? toCamelCase(colName) : colName;
      const nullable = !isNotNull && !isPrimaryKey;
      const optional =
        nullableOptional && nullable && !hasDefault && !isAutoIncrement;
      const nullSuffix = nullable ? " | null" : "";

      fields.push(
        `  ${fieldName}${optional ? "?" : ""}: ${tsType}${nullSuffix};`
      );
    }

    results.push(`${exportKw}interface ${interfaceName} {`);
    results.push(fields.join("\n"));
    results.push("}");
    results.push("");
  }

  if (!found) throw new Error("No CREATE TABLE statements found in input");

  return { output: results.join("\n").trimEnd() };
}

export const sqlToTypescript = defineTool({
  meta: {
    id: "code/sql-to-typescript",
    name: "SQL to TypeScript",
    description:
      "Free online SQL to TypeScript converter — generate TypeScript interfaces from CREATE TABLE statements with camelCase conversion, nullable types, and optional fields instantly in your browser. No data is stored.",
    category: "code",
    subgroup: "Version & Conversion",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "typescript",
      "interface",
      "table",
      "codegen",
      "database",
    ],
    examples: [
      {
        title: "Generate TypeScript from SQL",
        description:
          "Convert a CREATE TABLE statement to a TypeScript interface",
        input:
          "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP\n);",
        output:
          "// Generated from SQL CREATE TABLE statements\n\nexport interface Users {\n  id: number;\n  name: string;\n  email: string;\n  createdAt?: Date | null;\n}",
      },
    ],
    ui: { inputLanguage: "sql", outputLanguage: "typescript" },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
