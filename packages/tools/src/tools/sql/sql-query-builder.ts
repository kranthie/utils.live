import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  table: z.string().default("my_table").describe("Table name"),
  operation: z
    .enum(["select", "insert", "update", "delete"])
    .default("select")
    .describe("SQL operation"),
  columns: z.string().default("*").describe("Comma-separated column names"),
  where: z
    .string()
    .default("")
    .describe("WHERE conditions (e.g. 'id = 1 AND status = active')"),
  orderBy: z
    .string()
    .default("")
    .describe("ORDER BY columns (e.g. 'created_at DESC')"),
  limit: z.number().optional().describe("LIMIT rows"),
  offset: z.number().optional().describe("OFFSET rows"),
  groupBy: z.string().default("").describe("GROUP BY columns"),
  having: z.string().default("").describe("HAVING conditions"),
  joins: z
    .string()
    .default("")
    .describe(
      "JOIN clause (e.g. 'INNER JOIN orders ON users.id = orders.user_id')"
    ),
  values: z
    .string()
    .default("")
    .describe(
      'Values for INSERT (JSON format, e.g. \'{"name": "John", "age": 30}\')'
    ),
  setValues: z
    .string()
    .default("")
    .describe("SET values for UPDATE (e.g. 'name = John, age = 30')"),
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect"),
  distinct: z.boolean().default(false).describe("Use SELECT DISTINCT"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated SQL query"),
});

function quoteId(name: string, dialect: string): string {
  const n = name.trim();
  if (dialect === "mysql") return `\`${n}\``;
  if (dialect === "postgresql") return `"${n}"`;
  return n;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const table = input.table.trim() || "my_table";
  const dialect = input.dialect;
  const qt = (n: string): string => quoteId(n, dialect);

  if (input.operation === "select") {
    const cols = input.distinct ? `DISTINCT ${input.columns}` : input.columns;
    let sql = `SELECT ${cols}\nFROM ${qt(table)}`;
    if (input.joins) sql += `\n${input.joins}`;
    if (input.where) sql += `\nWHERE ${input.where}`;
    if (input.groupBy) sql += `\nGROUP BY ${input.groupBy}`;
    if (input.having) sql += `\nHAVING ${input.having}`;
    if (input.orderBy) sql += `\nORDER BY ${input.orderBy}`;
    if (input.limit !== undefined) sql += `\nLIMIT ${input.limit}`;
    if (input.offset !== undefined) sql += `\nOFFSET ${input.offset}`;
    return { output: sql + ";" };
  }

  if (input.operation === "insert") {
    if (!input.values)
      return {
        output: `INSERT INTO ${qt(table)} (${input.columns})\nVALUES ();`,
      };
    try {
      const parsed = JSON.parse(input.values) as Record<string, unknown>;
      const obj: Record<string, unknown> = Array.isArray(parsed)
        ? (parsed[0] as Record<string, unknown>)
        : parsed;
      if (typeof obj !== "object" || obj === null) throw new Error("Invalid");
      const keys = Object.keys(obj);
      const vals = keys.map((k) => {
        const v = obj[k];
        if (v === null) return "NULL";
        if (typeof v === "number") return String(v);
        if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
        const strVal =
          typeof v === "object" ? JSON.stringify(v) : String(v as string);
        return `'${strVal.replace(/'/g, "''")}'`;
      });
      return {
        output: `INSERT INTO ${qt(table)} (${keys.join(", ")})\nVALUES (${vals.join(", ")});`,
      };
    } catch {
      return {
        output: `INSERT INTO ${qt(table)} (${input.columns})\nVALUES (${input.values});`,
      };
    }
  }

  if (input.operation === "update") {
    let sql = `UPDATE ${qt(table)}`;
    if (input.setValues) {
      const sets = input.setValues
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      sql += `\nSET ${sets.join(",\n    ")}`;
    }
    if (input.where) sql += `\nWHERE ${input.where}`;
    return { output: sql + ";" };
  }

  if (input.operation === "delete") {
    let sql = `DELETE FROM ${qt(table)}`;
    if (input.where) sql += `\nWHERE ${input.where}`;
    return { output: sql + ";" };
  }

  return { output: "" };
}

export const sqlQueryBuilder = defineTool({
  meta: {
    id: "sql/sql-query-builder",
    name: "SQL Query Builder",
    description:
      "Free online SQL query builder — construct SELECT, INSERT, UPDATE, and DELETE queries from parameters with dialect support for MySQL, PostgreSQL, and SQLite instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "query",
      "builder",
      "generator",
      "select",
      "insert",
      "update",
      "delete",
    ],
    examples: [
      {
        title: "Build SELECT with Filter",
        description: "Build a SELECT query with WHERE clause and ORDER BY",
        input: {
          table: "users",
          operation: "select",
          columns: "name, email",
          where: "active = true",
          orderBy: "name",
          limit: 20,
        },
        output:
          "SELECT name, email\nFROM users\nWHERE active = true\nORDER BY name\nLIMIT 20;",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
