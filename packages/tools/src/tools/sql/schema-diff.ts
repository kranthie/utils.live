import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input1: z.string().describe("First SQL schema (CREATE TABLE statements)"),
  input2: z.string().describe("Second SQL schema (CREATE TABLE statements)"),
});

const outputSchema = z.object({
  identical: z.boolean().describe("Whether the schemas are identical"),
  original: z.string().describe("Summary of first schema"),
  modified: z.string().describe("Summary of second schema"),
  differences: z
    .array(
      z.object({
        type: z.enum([
          "table_added",
          "table_removed",
          "column_added",
          "column_removed",
          "column_modified",
          "type_changed",
          "constraint_changed",
        ]),
        table: z.string(),
        column: z.string().optional(),
        detail: z.string(),
      })
    )
    .describe("List of schema differences"),
  migrationSql: z.string().describe("SQL to migrate from schema 1 to schema 2"),
});

const optionsSchema = z.object({
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect for generated migration SQL"),
  ignoreCase: z
    .boolean()
    .default(true)
    .describe("Ignore identifier casing differences"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string | undefined;
  primaryKey: boolean;
  unique: boolean;
}

interface TableInfo {
  name: string;
  columns: Map<string, ColumnInfo>;
}

/**
 * Parses CREATE TABLE statements into a schema map.
 */
function parseSchema(sql: string, ignoreCase: boolean): Map<string, TableInfo> {
  const tables = new Map<string, TableInfo>();

  const createTableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|)?(\w+)(?:`|"|)?\s*\(([\s\S]*?)\)\s*;/gi;
  let match: RegExpExecArray | null;

  while ((match = createTableRegex.exec(sql)) !== null) {
    const rawTableName = match[1]!;
    const tableName = ignoreCase ? rawTableName.toLowerCase() : rawTableName;
    const body = match[2]!;
    const columns = new Map<string, ColumnInfo>();

    // Split columns, handling nested parentheses
    const lines: string[] = [];
    let current = "";
    let depth = 0;

    for (const ch of body) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        lines.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) lines.push(current.trim());

    const pkColumns = new Set<string>();

    for (const line of lines) {
      const upper = line.toUpperCase().trim();

      // Table-level PRIMARY KEY
      if (upper.startsWith("PRIMARY KEY")) {
        const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          const cols = pkMatch[1]!.split(",").map((c) => {
            const cleaned = c.trim().replace(/[`"]/g, "");
            return ignoreCase ? cleaned.toLowerCase() : cleaned;
          });
          cols.forEach((c) => pkColumns.add(c));
        }
        continue;
      }

      // Skip constraint lines
      if (
        upper.startsWith("FOREIGN KEY") ||
        upper.startsWith("CONSTRAINT") ||
        upper.startsWith("UNIQUE") ||
        upper.startsWith("CHECK") ||
        upper.startsWith("INDEX") ||
        upper.startsWith("KEY ")
      ) {
        continue;
      }

      // Column definition
      const colMatch = line.match(
        /^\s*(?:`|"|)?(\w+)(?:`|"|)?\s+(\w+(?:\([^)]*\))?)/i
      );
      if (colMatch) {
        const rawColName = colMatch[1]!;
        const colName = ignoreCase ? rawColName.toLowerCase() : rawColName;
        const colType = colMatch[2]!.toUpperCase();
        const isPK = upper.includes("PRIMARY KEY");
        const isNullable = !upper.includes("NOT NULL") && !isPK;
        const isUnique = upper.includes("UNIQUE");

        let defaultValue: string | undefined;
        const defaultMatch = line.match(/DEFAULT\s+(\S+)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1]!;
        }

        const colInfo: ColumnInfo = {
          name: colName,
          type: colType,
          nullable: isNullable,
          primaryKey: isPK,
          unique: isUnique,
        };
        if (defaultValue !== undefined) colInfo.defaultValue = defaultValue;
        columns.set(colName, colInfo);
      }
    }

    // Apply table-level PKs
    for (const [colName, col] of columns) {
      if (pkColumns.has(colName)) {
        col.primaryKey = true;
        col.nullable = false;
      }
    }

    tables.set(tableName, { name: tableName, columns });
  }

  return tables;
}

interface SchemaDiff {
  type:
    | "table_added"
    | "table_removed"
    | "column_added"
    | "column_removed"
    | "column_modified"
    | "type_changed"
    | "constraint_changed";
  table: string;
  column?: string;
  detail: string;
}

/**
 * Compares two schemas and returns differences.
 */
function execute(input: Input, options?: Options): Output {
  const sql1 = input.input1.trim();
  const sql2 = input.input2.trim();
  const dialect = options?.dialect ?? "standard";
  const ignoreCase = options?.ignoreCase ?? true;

  if (!sql1 && !sql2) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "Both schema inputs are empty",
    });
  }

  const schema1 = parseSchema(sql1, ignoreCase);
  const schema2 = parseSchema(sql2, ignoreCase);
  const differences: SchemaDiff[] = [];
  const migrationStatements: string[] = [];

  // Find removed tables
  for (const [tableName] of schema1) {
    if (!schema2.has(tableName)) {
      differences.push({
        type: "table_removed",
        table: tableName,
        detail: `Table '${tableName}' was removed`,
      });
      migrationStatements.push(`DROP TABLE IF EXISTS ${tableName};`);
    }
  }

  // Find added tables and column changes
  for (const [tableName, table2] of schema2) {
    const table1 = schema1.get(tableName);

    if (!table1) {
      differences.push({
        type: "table_added",
        table: tableName,
        detail: `Table '${tableName}' was added with ${table2.columns.size} columns`,
      });

      // Generate CREATE TABLE
      const colDefs: string[] = [];
      for (const [, col] of table2.columns) {
        let def = `  ${col.name} ${col.type}`;
        if (col.primaryKey) def += " PRIMARY KEY";
        if (!col.nullable && !col.primaryKey) def += " NOT NULL";
        if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
        if (col.unique) def += " UNIQUE";
        colDefs.push(def);
      }
      migrationStatements.push(
        `CREATE TABLE ${tableName} (\n${colDefs.join(",\n")}\n);`
      );
      continue;
    }

    // Compare columns
    for (const colName of table1.columns.keys()) {
      if (!table2.columns.has(colName)) {
        differences.push({
          type: "column_removed",
          table: tableName,
          column: colName,
          detail: `Column '${colName}' was removed from '${tableName}'`,
        });
        migrationStatements.push(
          `ALTER TABLE ${tableName} DROP COLUMN ${colName};`
        );
      }
    }

    for (const [colName, col2] of table2.columns) {
      const col1 = table1.columns.get(colName);

      if (!col1) {
        differences.push({
          type: "column_added",
          table: tableName,
          column: colName,
          detail: `Column '${colName}' (${col2.type}) was added to '${tableName}'`,
        });
        let addSql = `ALTER TABLE ${tableName} ADD COLUMN ${colName} ${col2.type}`;
        if (!col2.nullable) addSql += " NOT NULL";
        if (col2.defaultValue) addSql += ` DEFAULT ${col2.defaultValue}`;
        migrationStatements.push(addSql + ";");
        continue;
      }

      // Compare type
      if (col1.type !== col2.type) {
        differences.push({
          type: "type_changed",
          table: tableName,
          column: colName,
          detail: `Column '${colName}' type changed from ${col1.type} to ${col2.type}`,
        });
        if (dialect === "mysql") {
          migrationStatements.push(
            `ALTER TABLE ${tableName} MODIFY COLUMN ${colName} ${col2.type};`
          );
        } else {
          migrationStatements.push(
            `ALTER TABLE ${tableName} ALTER COLUMN ${colName} TYPE ${col2.type};`
          );
        }
      }

      // Compare nullable
      if (col1.nullable !== col2.nullable) {
        differences.push({
          type: "constraint_changed",
          table: tableName,
          column: colName,
          detail: `Column '${colName}' nullable changed from ${col1.nullable} to ${col2.nullable}`,
        });
        if (col2.nullable) {
          migrationStatements.push(
            `ALTER TABLE ${tableName} ALTER COLUMN ${colName} DROP NOT NULL;`
          );
        } else {
          migrationStatements.push(
            `ALTER TABLE ${tableName} ALTER COLUMN ${colName} SET NOT NULL;`
          );
        }
      }

      // Compare default
      if (col1.defaultValue !== col2.defaultValue) {
        differences.push({
          type: "constraint_changed",
          table: tableName,
          column: colName,
          detail: `Column '${colName}' default changed from ${col1.defaultValue ?? "none"} to ${col2.defaultValue ?? "none"}`,
        });
        if (col2.defaultValue) {
          migrationStatements.push(
            `ALTER TABLE ${tableName} ALTER COLUMN ${colName} SET DEFAULT ${col2.defaultValue};`
          );
        } else {
          migrationStatements.push(
            `ALTER TABLE ${tableName} ALTER COLUMN ${colName} DROP DEFAULT;`
          );
        }
      }
    }
  }

  const originalSummary = `Schema 1: ${schema1.size} tables`;
  const modifiedSummary = `Schema 2: ${schema2.size} tables`;
  const migrationSql =
    migrationStatements.length > 0
      ? migrationStatements.join("\n\n")
      : "-- No changes needed";

  return {
    identical: differences.length === 0,
    original: originalSummary,
    modified: modifiedSummary,
    differences,
    migrationSql,
  };
}

/**
 * Schema Diff tool.
 * Compares two database schemas and generates migration SQL.
 */
export const sqlSchemaDiff = defineTool({
  meta: {
    id: "sql/schema-diff",
    name: "Schema Diff",
    description:
      "Free online SQL schema diff tool — compare two database schemas and generate ALTER TABLE migration statements for added, removed, and modified columns instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "schema",
      "diff",
      "compare",
      "migration",
      "database",
      "ddl",
    ],
    examples: [
      {
        title: "Schema Evolution",
        description: "Compare two table schemas and generate migration SQL",
        input: {
          input1: "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));",
          input2:
            "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(255));",
        },
        output:
          '{\n  "identical": false,\n  "original": "Schema 1: 1 tables",\n  "modified": "Schema 2: 1 tables",\n  "differences": [\n    {\n      "type": "column_added",\n      "table": "users",\n      "column": "email",\n      "detail": "Column \'email\' (VARCHAR(255)) was added to \'users\'"\n    }\n  ],\n  "migrationSql": "ALTER TABLE users ADD COLUMN email VARCHAR(255);"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
