import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const columnSchema = z.object({
  name: z.string().describe("Column name"),
  type: z.string().describe("Data type (e.g., VARCHAR(255), INTEGER, BOOLEAN)"),
  nullable: z.boolean().default(true).describe("Allow NULL values"),
  defaultValue: z.string().optional().describe("Default value"),
  primaryKey: z.boolean().default(false).describe("Is primary key"),
  unique: z.boolean().default(false).describe("Has UNIQUE constraint"),
  autoIncrement: z.boolean().default(false).describe("Auto increment"),
  references: z
    .object({
      table: z.string(),
      column: z.string(),
      onDelete: z
        .enum(["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"])
        .optional(),
      onUpdate: z
        .enum(["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"])
        .optional(),
    })
    .optional()
    .describe("Foreign key reference"),
  check: z.string().optional().describe("CHECK constraint expression"),
});

const inputSchema = z.object({
  tableName: z.string().describe("Name of the table to create"),
  columns: z.array(columnSchema).min(1).describe("Table columns"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated CREATE TABLE SQL statement"),
  columnCount: z.number().describe("Number of columns"),
  constraintCount: z.number().describe("Number of constraints"),
});

const optionsSchema = z.object({
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect"),
  ifNotExists: z.boolean().default(false).describe("Add IF NOT EXISTS clause"),
  schema: z.string().optional().describe("Schema name (e.g., public)"),
  primaryKeyColumns: z
    .array(z.string())
    .optional()
    .describe("Composite primary key columns"),
  indices: z
    .array(
      z.object({
        name: z.string(),
        columns: z.array(z.string()),
        unique: z.boolean().default(false),
      })
    )
    .optional()
    .describe("Indices to create"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Generates a CREATE TABLE SQL statement from a schema definition.
 */
function execute(input: Input, options?: Options): Output {
  const { tableName, columns } = input;
  const dialect = options?.dialect ?? "standard";
  const ifNotExists = options?.ifNotExists ?? false;
  const schema = options?.schema;
  const compositePK = options?.primaryKeyColumns;
  const indices = options?.indices;

  if (!tableName.trim()) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "Table name cannot be empty",
    });
  }

  const fullTableName = schema ? `${schema}.${tableName}` : tableName;
  const lines: string[] = [];
  const constraints: string[] = [];
  let constraintCount = 0;

  // Column definitions
  for (const col of columns) {
    let line = `  ${quoteIdentifier(col.name, dialect)} ${resolveType(col.type, col.autoIncrement, dialect)}`;

    if (col.primaryKey && !compositePK) {
      line += " PRIMARY KEY";
      constraintCount++;
    }

    if (col.autoIncrement && dialect !== "postgresql") {
      if (dialect === "mysql") {
        line += " AUTO_INCREMENT";
      } else if (dialect === "sqlite") {
        // SQLite uses AUTOINCREMENT with INTEGER PRIMARY KEY
        if (!col.primaryKey) {
          line += " AUTOINCREMENT";
        }
      }
    }

    if (!col.nullable && !col.primaryKey) {
      line += " NOT NULL";
    }

    if (col.unique) {
      line += " UNIQUE";
      constraintCount++;
    }

    if (col.defaultValue !== undefined) {
      line += ` DEFAULT ${col.defaultValue}`;
    }

    if (col.check) {
      line += ` CHECK (${col.check})`;
      constraintCount++;
    }

    if (col.references) {
      const ref = col.references;
      let refStr = ` REFERENCES ${quoteIdentifier(ref.table, dialect)}(${quoteIdentifier(ref.column, dialect)})`;
      if (ref.onDelete) {
        refStr += ` ON DELETE ${ref.onDelete}`;
      }
      if (ref.onUpdate) {
        refStr += ` ON UPDATE ${ref.onUpdate}`;
      }
      line += refStr;
      constraintCount++;
    }

    lines.push(line);
  }

  // Composite primary key
  if (compositePK && compositePK.length > 0) {
    const pkCols = compositePK
      .map((c) => quoteIdentifier(c, dialect))
      .join(", ");
    constraints.push(`  PRIMARY KEY (${pkCols})`);
    constraintCount++;
  }

  // Build the statement
  const allLines = [...lines, ...constraints];
  let sql = "CREATE TABLE ";
  if (ifNotExists) {
    sql += "IF NOT EXISTS ";
  }
  sql += `${fullTableName} (\n`;
  sql += allLines.join(",\n");
  sql += "\n);";

  // Add indices
  if (indices && indices.length > 0) {
    sql += "\n";
    for (const idx of indices) {
      const uniqueStr = idx.unique ? "UNIQUE " : "";
      const idxCols = idx.columns
        .map((c) => quoteIdentifier(c, dialect))
        .join(", ");
      sql += `\nCREATE ${uniqueStr}INDEX ${quoteIdentifier(idx.name, dialect)} ON ${fullTableName} (${idxCols});`;
      constraintCount++;
    }
  }

  return {
    output: sql,
    columnCount: columns.length,
    constraintCount,
  };
}

/**
 * Quotes an identifier based on dialect.
 */
function quoteIdentifier(name: string, dialect: string): string {
  // Only quote if contains special characters or is a reserved word
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return name;
  }
  switch (dialect) {
    case "mysql":
      return `\`${name}\``;
    case "mssql":
      return `[${name}]`;
    default:
      return `"${name}"`;
  }
}

/**
 * Resolves the data type, handling auto-increment types for PostgreSQL.
 */
function resolveType(
  type: string,
  autoIncrement: boolean,
  dialect: string
): string {
  if (autoIncrement && dialect === "postgresql") {
    const upper = type.toUpperCase();
    if (upper === "INTEGER" || upper === "INT") {
      return "SERIAL";
    }
    if (upper === "BIGINT") {
      return "BIGSERIAL";
    }
    if (upper === "SMALLINT") {
      return "SMALLSERIAL";
    }
  }
  return type;
}

/**
 * CREATE TABLE Generator tool.
 * Generates CREATE TABLE statements from schema definitions.
 */
export const sqlCreateTableGenerator = defineTool({
  meta: {
    id: "sql/create-table-generator",
    name: "CREATE TABLE Generator",
    description:
      "Free online CREATE TABLE generator — build SQL CREATE TABLE statements from column definitions with constraints instantly in your browser. No data is stored. Supports primary keys, unique constraints, NOT NULL, defaults, auto-increment, foreign keys, and check constraints.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "create",
      "table",
      "generate",
      "schema",
      "ddl",
      "database",
    ],
    examples: [
      {
        title: "Users Table with Constraints",
        description: "Generate a CREATE TABLE statement for a users table",
        input: {
          tableName: "users",
          columns: [
            { name: "id", type: "SERIAL", primaryKey: true },
            {
              name: "email",
              type: "VARCHAR(255)",
              nullable: false,
              unique: true,
            },
            { name: "name", type: "VARCHAR(100)" },
            { name: "created_at", type: "TIMESTAMP", defaultValue: "NOW()" },
          ],
        },
        output:
          "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) NOT NULL UNIQUE,\n  name VARCHAR(100),\n  created_at TIMESTAMP DEFAULT NOW()\n);",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
