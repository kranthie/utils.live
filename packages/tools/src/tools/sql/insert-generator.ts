import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  tableName: z.string().describe("Target table name"),
  columns: z.array(z.string()).min(1).describe("Column names"),
  rows: z
    .array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .min(1)
    .describe("Data rows (2D array of values)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated INSERT SQL statements"),
  rowCount: z.number().describe("Number of rows to insert"),
  statementCount: z.number().describe("Number of INSERT statements generated"),
});

const optionsSchema = z.object({
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect"),
  batchSize: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(100)
    .describe("Number of rows per INSERT statement"),
  onConflict: z
    .enum(["none", "ignore", "update"])
    .default("none")
    .describe("Conflict handling strategy"),
  conflictColumns: z
    .array(z.string())
    .optional()
    .describe("Columns for ON CONFLICT clause (PostgreSQL)"),
  includeTransaction: z
    .boolean()
    .default(false)
    .describe("Wrap in BEGIN/COMMIT transaction"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Formats a value for SQL insertion.
 */
function formatValue(
  value: string | number | boolean | null,
  dialect: string
): string {
  if (value === null) {
    return "NULL";
  }
  if (typeof value === "boolean") {
    if (dialect === "mysql" || dialect === "sqlite") {
      return value ? "1" : "0";
    }
    return value ? "TRUE" : "FALSE";
  }
  if (typeof value === "number") {
    return String(value);
  }
  // String: escape single quotes
  const escaped = value.replace(/'/g, "''");
  return `'${escaped}'`;
}

/**
 * Generates INSERT statements from data.
 */
function execute(input: Input, options?: Options): Output {
  const { tableName, columns, rows } = input;
  const dialect = options?.dialect ?? "standard";
  const batchSize = options?.batchSize ?? 100;
  const onConflict = options?.onConflict ?? "none";
  const conflictColumns = options?.conflictColumns;
  const includeTransaction = options?.includeTransaction ?? false;

  if (!tableName.trim()) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "Table name cannot be empty",
    });
  }

  // Validate row widths
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]!.length !== columns.length) {
      throw createToolError({
        code: EXEC_FAILED,
        message: `Row ${i + 1} has ${rows[i]!.length} values but ${columns.length} columns were specified`,
      });
    }
  }

  const statements: string[] = [];
  const columnList = columns.join(", ");

  // Generate batched INSERT statements
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const valuesList = batch
      .map((row) => {
        const values = row.map((v) => formatValue(v, dialect)).join(", ");
        return `  (${values})`;
      })
      .join(",\n");

    let stmt = "";

    if (onConflict === "ignore") {
      if (dialect === "mysql") {
        stmt = `INSERT IGNORE INTO ${tableName} (${columnList})\nVALUES\n${valuesList};`;
      } else if (dialect === "sqlite") {
        stmt = `INSERT OR IGNORE INTO ${tableName} (${columnList})\nVALUES\n${valuesList};`;
      } else if (dialect === "postgresql") {
        const conflictCols = conflictColumns?.join(", ") ?? columns[0];
        stmt = `INSERT INTO ${tableName} (${columnList})\nVALUES\n${valuesList}\nON CONFLICT (${conflictCols}) DO NOTHING;`;
      } else {
        stmt = `INSERT INTO ${tableName} (${columnList})\nVALUES\n${valuesList};`;
      }
    } else if (onConflict === "update") {
      if (dialect === "mysql") {
        const updateCols = columns
          .map((c) => `  ${c} = VALUES(${c})`)
          .join(",\n");
        stmt = `INSERT INTO ${tableName} (${columnList})\nVALUES\n${valuesList}\nON DUPLICATE KEY UPDATE\n${updateCols};`;
      } else if (dialect === "postgresql") {
        const conflictCols = conflictColumns?.join(", ") ?? columns[0];
        const updateCols = columns
          .filter((c) => !conflictColumns?.includes(c))
          .map((c) => `  ${c} = EXCLUDED.${c}`)
          .join(",\n");
        stmt = `INSERT INTO ${tableName} (${columnList})\nVALUES\n${valuesList}\nON CONFLICT (${conflictCols}) DO UPDATE SET\n${updateCols};`;
      } else if (dialect === "sqlite") {
        const conflictCols = conflictColumns?.join(", ") ?? columns[0];
        const updateCols = columns
          .filter((c) => !conflictColumns?.includes(c))
          .map((c) => `  ${c} = EXCLUDED.${c}`)
          .join(",\n");
        stmt = `INSERT INTO ${tableName} (${columnList})\nVALUES\n${valuesList}\nON CONFLICT (${conflictCols}) DO UPDATE SET\n${updateCols};`;
      } else {
        stmt = `INSERT INTO ${tableName} (${columnList})\nVALUES\n${valuesList};`;
      }
    } else {
      stmt = `INSERT INTO ${tableName} (${columnList})\nVALUES\n${valuesList};`;
    }

    statements.push(stmt);
  }

  let output = "";
  if (includeTransaction) {
    output = "BEGIN;\n\n" + statements.join("\n\n") + "\n\nCOMMIT;";
  } else {
    output = statements.join("\n\n");
  }

  return {
    output,
    rowCount: rows.length,
    statementCount: statements.length,
  };
}

/**
 * INSERT Generator tool.
 * Generates INSERT statements from tabular data.
 */
export const sqlInsertGenerator = defineTool({
  meta: {
    id: "sql/insert-generator",
    name: "INSERT Generator",
    description:
      "Free online SQL INSERT generator — build INSERT statements from table name, column definitions, and row data instantly in your browser. No data is stored. Supports multiple rows, batch inserts, and various SQL dialects.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "insert", "generate", "data", "bulk", "import"],
    examples: [
      {
        title: "Insert Product Rows",
        description: "Generate INSERT statements for product data",
        input: {
          tableName: "products",
          columns: ["name", "price", "category"],
          rows: [
            ["Laptop", 999.99, "Electronics"],
            ["Desk Chair", 249.5, "Furniture"],
          ],
        },
        output:
          "INSERT INTO products (name, price, category)\nVALUES\n  ('Laptop', 999.99, 'Electronics'),\n  ('Desk Chair', 249.5, 'Furniture');",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
