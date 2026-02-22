import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const joinSchema = z.object({
  type: z
    .enum(["INNER", "LEFT", "RIGHT", "FULL", "CROSS"])
    .default("INNER")
    .describe("Join type"),
  table: z.string().describe("Table to join"),
  alias: z.string().optional().describe("Table alias"),
  on: z.string().describe("Join condition (e.g., 'a.id = b.id')"),
});

const whereConditionSchema = z.object({
  column: z.string().describe("Column name"),
  operator: z
    .enum([
      "=",
      "!=",
      "<>",
      "<",
      ">",
      "<=",
      ">=",
      "LIKE",
      "ILIKE",
      "IN",
      "NOT IN",
      "IS NULL",
      "IS NOT NULL",
      "BETWEEN",
    ])
    .default("=")
    .describe("Comparison operator"),
  value: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(z.union([z.string(), z.number()])),
    ])
    .optional()
    .describe("Value to compare against"),
  logic: z
    .enum(["AND", "OR"])
    .default("AND")
    .describe("Logic operator before this condition"),
});

const orderBySchema = z.object({
  column: z.string().describe("Column to order by"),
  direction: z.enum(["ASC", "DESC"]).default("ASC").describe("Sort direction"),
});

const inputSchema = z.object({
  table: z.string().describe("Main table name"),
  tableAlias: z.string().optional().describe("Main table alias"),
  columns: z
    .array(z.string())
    .min(1)
    .describe("Columns to select (use '*' for all)"),
  distinct: z.boolean().default(false).describe("Use DISTINCT"),
  joins: z.array(joinSchema).optional().describe("JOIN clauses"),
  where: z.array(whereConditionSchema).optional().describe("WHERE conditions"),
  groupBy: z.array(z.string()).optional().describe("GROUP BY columns"),
  having: z.string().optional().describe("HAVING clause expression"),
  orderBy: z.array(orderBySchema).optional().describe("ORDER BY clauses"),
  limit: z.number().int().optional().describe("LIMIT value"),
  offset: z.number().int().optional().describe("OFFSET value"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated SELECT SQL query"),
  clauseCount: z.number().describe("Number of SQL clauses used"),
});

const optionsSchema = z.object({
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect"),
  uppercase: z.boolean().default(true).describe("Uppercase SQL keywords"),
  indent: z.number().min(1).max(8).default(2).describe("Indentation size"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Formats a WHERE condition value for SQL.
 */
function formatWhereValue(
  value: string | number | boolean | null | Array<string | number> | undefined,
  operator: string
): string {
  if (operator === "IS NULL" || operator === "IS NOT NULL") {
    return "";
  }

  if (value === null) return "NULL";
  if (value === undefined) return "NULL";

  if (Array.isArray(value)) {
    const items = value.map((v) =>
      typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : String(v)
    );
    return `(${items.join(", ")})`;
  }

  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Builds a SELECT query from structured input.
 */
function execute(input: Input, options?: Options): Output {
  const {
    table,
    tableAlias,
    columns,
    distinct,
    joins,
    where,
    groupBy,
    having,
    orderBy,
    limit,
    offset,
  } = input;
  const upper = options?.uppercase ?? true;
  const indentSize = options?.indent ?? 2;
  const ind = " ".repeat(indentSize);

  if (!table.trim()) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "Table name cannot be empty",
    });
  }

  const kw = (keyword: string): string =>
    upper ? keyword.toUpperCase() : keyword.toLowerCase();
  const parts: string[] = [];
  let clauseCount = 0;

  // SELECT
  const selectKeyword = distinct
    ? `${kw("SELECT")} ${kw("DISTINCT")}`
    : kw("SELECT");
  const columnList = columns.map((c) => `${ind}${c}`).join(",\n");
  parts.push(`${selectKeyword}\n${columnList}`);
  clauseCount++;

  // FROM
  const fromTable = tableAlias ? `${table} ${tableAlias}` : table;
  parts.push(`${kw("FROM")}\n${ind}${fromTable}`);
  clauseCount++;

  // JOINs
  if (joins && joins.length > 0) {
    for (const join of joins) {
      const joinTable = join.alias ? `${join.table} ${join.alias}` : join.table;
      const joinType = upper ? join.type : join.type.toLowerCase();
      parts.push(
        `${joinType} ${kw("JOIN")} ${joinTable}\n${ind}${kw("ON")} ${join.on}`
      );
      clauseCount++;
    }
  }

  // WHERE
  if (where && where.length > 0) {
    const conditions: string[] = [];
    for (let i = 0; i < where.length; i++) {
      const cond = where[i]!;
      let condStr = "";

      if (cond.operator === "IS NULL") {
        condStr = `${cond.column} ${kw("IS NULL")}`;
      } else if (cond.operator === "IS NOT NULL") {
        condStr = `${cond.column} ${kw("IS NOT NULL")}`;
      } else if (cond.operator === "BETWEEN") {
        const values = Array.isArray(cond.value)
          ? cond.value
          : [cond.value, cond.value];
        const low =
          typeof values[0] === "string"
            ? `'${String(values[0]).replace(/'/g, "''")}'`
            : String(values[0]);
        const high =
          typeof values[1] === "string"
            ? `'${String(values[1]).replace(/'/g, "''")}'`
            : String(values[1]);
        condStr = `${cond.column} ${kw("BETWEEN")} ${low} ${kw("AND")} ${high}`;
      } else {
        const val = formatWhereValue(cond.value, cond.operator);
        const op = upper ? cond.operator : cond.operator.toLowerCase();
        condStr = `${cond.column} ${op} ${val}`;
      }

      if (i === 0) {
        conditions.push(`${ind}${condStr}`);
      } else {
        const logic = upper ? cond.logic : cond.logic.toLowerCase();
        conditions.push(`${ind}${logic} ${condStr}`);
      }
    }
    parts.push(`${kw("WHERE")}\n${conditions.join("\n")}`);
    clauseCount++;
  }

  // GROUP BY
  if (groupBy && groupBy.length > 0) {
    parts.push(`${kw("GROUP BY")}\n${ind}${groupBy.join(", ")}`);
    clauseCount++;
  }

  // HAVING
  if (having) {
    parts.push(`${kw("HAVING")}\n${ind}${having}`);
    clauseCount++;
  }

  // ORDER BY
  if (orderBy && orderBy.length > 0) {
    const orderClauses = orderBy
      .map((o) => {
        const dir = upper ? o.direction : o.direction.toLowerCase();
        return `${o.column} ${dir}`;
      })
      .join(", ");
    parts.push(`${kw("ORDER BY")}\n${ind}${orderClauses}`);
    clauseCount++;
  }

  // LIMIT
  if (limit !== undefined) {
    parts.push(`${kw("LIMIT")} ${limit}`);
    clauseCount++;
  }

  // OFFSET
  if (offset !== undefined) {
    parts.push(`${kw("OFFSET")} ${offset}`);
    clauseCount++;
  }

  const output = parts.join("\n") + ";";

  return {
    output,
    clauseCount,
  };
}

/**
 * SELECT Builder tool.
 * Visual SELECT query builder that generates SQL.
 */
export const sqlSelectBuilder = defineTool({
  meta: {
    id: "sql/select-builder",
    name: "SELECT Builder",
    description:
      "Free online SQL SELECT builder — construct SELECT queries with joins, WHERE, GROUP BY, HAVING, ORDER BY, and LIMIT clauses from structured input instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "select", "build", "query", "visual", "builder"],
    examples: [
      {
        title: "User Orders Query",
        description: "Build a SELECT query joining users and orders",
        input: {
          table: "users",
          tableAlias: "u",
          columns: ["u.name", "o.total"],
          joins: [
            {
              type: "INNER",
              table: "orders",
              alias: "o",
              on: "u.id = o.user_id",
            },
          ],
          where: [{ column: "o.total", operator: ">", value: 100 }],
          orderBy: [{ column: "o.total", direction: "DESC" }],
          limit: 10,
        },
        output:
          "SELECT\n  u.name,\n  o.total\nFROM\n  users u\nINNER JOIN orders o\n  ON u.id = o.user_id\nWHERE\n  o.total > 100\nORDER BY\n  o.total DESC\nLIMIT 10;",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
