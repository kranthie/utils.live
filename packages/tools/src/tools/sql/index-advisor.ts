import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe("SQL query or queries to analyze for index suggestions"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted index recommendations"),
  suggestions: z
    .array(
      z.object({
        table: z.string().describe("Table that would benefit from an index"),
        columns: z
          .array(z.string())
          .describe("Columns to include in the index"),
        reason: z.string().describe("Why this index is recommended"),
        priority: z.enum(["high", "medium", "low"]),
        createStatement: z.string().describe("CREATE INDEX SQL statement"),
      })
    )
    .describe("Index suggestions"),
  analyzedQueries: z.number().describe("Number of queries analyzed"),
});

const optionsSchema = z.object({
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect for generated index statements"),
  indexPrefix: z
    .string()
    .default("idx")
    .describe("Prefix for generated index names"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface IndexSuggestion {
  table: string;
  columns: string[];
  reason: string;
  priority: "high" | "medium" | "low";
}

/**
 * Extracts table names from FROM clauses and JOINs.
 */
function extractTables(sql: string): Map<string, string> {
  const tables = new Map<string, string>(); // alias -> tableName

  // FROM clause tables
  const fromMatch = sql.match(/\bFROM\s+([\w.`"]+)(?:\s+(?:AS\s+)?(\w+))?/gi);
  if (fromMatch) {
    for (const m of fromMatch) {
      const parsed = m.match(/\bFROM\s+([\w.`"]+)(?:\s+(?:AS\s+)?(\w+))?/i);
      if (parsed) {
        const tableName = parsed[1]!.replace(/[`"]/g, "");
        const alias = parsed[2] ?? tableName;
        tables.set(alias.toLowerCase(), tableName.toLowerCase());
      }
    }
  }

  // JOIN tables
  const joinMatch = sql.match(/\bJOIN\s+([\w.`"]+)(?:\s+(?:AS\s+)?(\w+))?/gi);
  if (joinMatch) {
    for (const m of joinMatch) {
      const parsed = m.match(/\bJOIN\s+([\w.`"]+)(?:\s+(?:AS\s+)?(\w+))?/i);
      if (parsed) {
        const tableName = parsed[1]!.replace(/[`"]/g, "");
        const alias = parsed[2] ?? tableName;
        tables.set(alias.toLowerCase(), tableName.toLowerCase());
      }
    }
  }

  return tables;
}

/**
 * Extracts column references from WHERE conditions.
 */
function extractWhereColumns(
  sql: string
): Array<{ column: string; table?: string | undefined; operator: string }> {
  const columns: Array<{
    column: string;
    table?: string | undefined;
    operator: string;
  }> = [];

  // Match WHERE clause
  const whereMatch = sql.match(
    /\bWHERE\b([\s\S]*?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bHAVING\b|\bLIMIT\b|\bUNION\b|;|$)/i
  );
  if (!whereMatch) return columns;

  const wherePart = whereMatch[1]!;

  // Extract column = value patterns
  const condRegex =
    /(?:(\w+)\.)?(\w+)\s*(=|<>|!=|>|<|>=|<=|LIKE|ILIKE|IN|IS|BETWEEN)/gi;
  let match: RegExpExecArray | null;

  while ((match = condRegex.exec(wherePart)) !== null) {
    columns.push({
      table: match[1]?.toLowerCase(),
      column: match[2]!.toLowerCase(),
      operator: match[3]!.toUpperCase(),
    });
  }

  return columns;
}

/**
 * Extracts JOIN condition columns.
 */
function extractJoinColumns(sql: string): Array<{
  leftTable?: string | undefined;
  leftColumn: string;
  rightTable?: string | undefined;
  rightColumn: string;
}> {
  const joins: Array<{
    leftTable?: string | undefined;
    leftColumn: string;
    rightTable?: string | undefined;
    rightColumn: string;
  }> = [];

  const onRegex = /\bON\s+(?:(\w+)\.)?(\w+)\s*=\s*(?:(\w+)\.)?(\w+)/gi;
  let match: RegExpExecArray | null;

  while ((match = onRegex.exec(sql)) !== null) {
    joins.push({
      leftTable: match[1]?.toLowerCase(),
      leftColumn: match[2]!.toLowerCase(),
      rightTable: match[3]?.toLowerCase(),
      rightColumn: match[4]!.toLowerCase(),
    });
  }

  return joins;
}

/**
 * Extracts ORDER BY columns.
 */
function extractOrderByColumns(
  sql: string
): Array<{ column: string; table?: string | undefined }> {
  const columns: Array<{ column: string; table?: string | undefined }> = [];

  const orderMatch = sql.match(
    /\bORDER\s+BY\b([\s\S]*?)(?:\bLIMIT\b|\bOFFSET\b|\bUNION\b|;|$)/i
  );
  if (!orderMatch) return columns;

  const orderPart = orderMatch[1]!;
  const colRegex = /(?:(\w+)\.)?(\w+)(?:\s+(?:ASC|DESC))?/gi;
  let match: RegExpExecArray | null;

  while ((match = colRegex.exec(orderPart)) !== null) {
    const col = match[2]!.toLowerCase();
    if (!["asc", "desc", "nulls", "first", "last"].includes(col)) {
      columns.push({
        table: match[1]?.toLowerCase(),
        column: col,
      });
    }
  }

  return columns;
}

/**
 * Extracts GROUP BY columns.
 */
function extractGroupByColumns(
  sql: string
): Array<{ column: string; table?: string | undefined }> {
  const columns: Array<{ column: string; table?: string | undefined }> = [];

  const groupMatch = sql.match(
    /\bGROUP\s+BY\b([\s\S]*?)(?:\bHAVING\b|\bORDER\s+BY\b|\bLIMIT\b|\bUNION\b|;|$)/i
  );
  if (!groupMatch) return columns;

  const groupPart = groupMatch[1]!;
  const colRegex = /(?:(\w+)\.)?(\w+)/gi;
  let match: RegExpExecArray | null;

  while ((match = colRegex.exec(groupPart)) !== null) {
    columns.push({
      table: match[1]?.toLowerCase(),
      column: match[2]!.toLowerCase(),
    });
  }

  return columns;
}

/**
 * Resolves a table alias to actual table name.
 */
function resolveTable(
  alias: string | undefined,
  tables: Map<string, string>,
  defaultTable?: string
): string {
  if (alias) {
    return tables.get(alias) ?? alias;
  }
  if (defaultTable) return defaultTable;
  // If only one table, use it
  if (tables.size === 1) {
    return Array.from(tables.values())[0]!;
  }
  return "unknown";
}

/**
 * Analyzes SQL queries and suggests indexes.
 */
function execute(input: Input, options?: Options): Output {
  const sql = input.input.trim();
  if (!sql) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "SQL input is empty",
    });
  }

  const indexPrefix = options?.indexPrefix ?? "idx";

  // Split into statements
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const allSuggestions: IndexSuggestion[] = [];
  const seenIndexes = new Set<string>();

  for (const stmt of statements) {
    const upper = stmt.toUpperCase();
    if (
      !upper.startsWith("SELECT") &&
      !upper.startsWith("UPDATE") &&
      !upper.startsWith("DELETE") &&
      !upper.startsWith("WITH")
    ) {
      continue;
    }

    const tables = extractTables(stmt);
    const defaultTable =
      tables.size === 1 ? Array.from(tables.values())[0] : undefined;

    // WHERE clause analysis
    const whereCols = extractWhereColumns(stmt);
    for (const wc of whereCols) {
      const tableName = resolveTable(wc.table, tables, defaultTable);
      const key = `${tableName}.${wc.column}`;
      if (seenIndexes.has(key)) continue;
      seenIndexes.add(key);

      const priority = wc.operator === "=" ? "high" : "medium";
      allSuggestions.push({
        table: tableName,
        columns: [wc.column],
        reason: `Column used in WHERE clause with ${wc.operator} operator`,
        priority,
      });
    }

    // JOIN condition analysis
    const joinCols = extractJoinColumns(stmt);
    for (const jc of joinCols) {
      const leftTable = resolveTable(jc.leftTable, tables, defaultTable);
      const rightTable = resolveTable(jc.rightTable, tables, defaultTable);

      for (const [tbl, col] of [
        [leftTable, jc.leftColumn],
        [rightTable, jc.rightColumn],
      ]) {
        const key = `${tbl}.${col}`;
        if (seenIndexes.has(key)) continue;
        seenIndexes.add(key);

        allSuggestions.push({
          table: tbl as string,
          columns: [col as string],
          reason: "Column used in JOIN condition",
          priority: "high",
        });
      }
    }

    // ORDER BY analysis
    const orderCols = extractOrderByColumns(stmt);
    if (orderCols.length > 0) {
      const tableName = resolveTable(orderCols[0]?.table, tables, defaultTable);
      const cols = orderCols
        .filter(
          (c) => resolveTable(c.table, tables, defaultTable) === tableName
        )
        .map((c) => c.column);

      const key = `${tableName}.${cols.join("+")}`;
      if (!seenIndexes.has(key) && cols.length > 0) {
        seenIndexes.add(key);
        allSuggestions.push({
          table: tableName,
          columns: cols,
          reason: "Columns used in ORDER BY clause",
          priority: "medium",
        });
      }
    }

    // GROUP BY analysis
    const groupCols = extractGroupByColumns(stmt);
    if (groupCols.length > 0) {
      const tableName = resolveTable(groupCols[0]?.table, tables, defaultTable);
      const cols = groupCols
        .filter(
          (c) => resolveTable(c.table, tables, defaultTable) === tableName
        )
        .map((c) => c.column);

      const key = `${tableName}.group.${cols.join("+")}`;
      if (!seenIndexes.has(key) && cols.length > 0) {
        seenIndexes.add(key);
        allSuggestions.push({
          table: tableName,
          columns: cols,
          reason: "Columns used in GROUP BY clause",
          priority: "medium",
        });
      }
    }

    // Composite index for WHERE + ORDER BY covering
    if (whereCols.length > 0 && orderCols.length > 0) {
      const whereTable = resolveTable(
        whereCols[0]?.table,
        tables,
        defaultTable
      );
      const orderTable = resolveTable(
        orderCols[0]?.table,
        tables,
        defaultTable
      );

      if (whereTable === orderTable) {
        const wCols = whereCols
          .filter(
            (c) => resolveTable(c.table, tables, defaultTable) === whereTable
          )
          .map((c) => c.column);
        const oCols = orderCols
          .filter(
            (c) => resolveTable(c.table, tables, defaultTable) === orderTable
          )
          .map((c) => c.column);

        const combined = [...new Set([...wCols, ...oCols])];
        if (combined.length > 1) {
          const key = `${whereTable}.composite.${combined.join("+")}`;
          if (!seenIndexes.has(key)) {
            seenIndexes.add(key);
            allSuggestions.push({
              table: whereTable,
              columns: combined,
              reason:
                "Composite index covering WHERE and ORDER BY columns for efficient filtering and sorting",
              priority: "low",
            });
          }
        }
      }
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allSuggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  // Generate CREATE INDEX statements
  const suggestionsWithSql = allSuggestions.map((s) => {
    const indexName = `${indexPrefix}_${s.table}_${s.columns.join("_")}`;
    const createStatement = `CREATE INDEX ${indexName} ON ${s.table} (${s.columns.join(", ")});`;
    return {
      ...s,
      createStatement,
    };
  });

  // Format output
  const outputLines: string[] = [
    `Index Advisor Report`,
    `${"=".repeat(50)}`,
    `Queries analyzed: ${statements.length}`,
    `Suggestions: ${suggestionsWithSql.length}`,
    "",
  ];

  for (let i = 0; i < suggestionsWithSql.length; i++) {
    const s = suggestionsWithSql[i]!;
    outputLines.push(
      `${i + 1}. [${s.priority.toUpperCase()}] ${s.table}(${s.columns.join(", ")})`
    );
    outputLines.push(`   Reason: ${s.reason}`);
    outputLines.push(`   SQL: ${s.createStatement}`);
    outputLines.push("");
  }

  return {
    output: outputLines.join("\n"),
    suggestions: suggestionsWithSql,
    analyzedQueries: statements.length,
  };
}

/**
 * Index Advisor tool.
 * Analyzes SQL queries and suggests indexes for better performance.
 */
export const sqlIndexAdvisor = defineTool({
  meta: {
    id: "sql/index-advisor",
    name: "Index Advisor",
    description:
      "Free online SQL index advisor — analyze SQL queries and suggest optimal indexes for WHERE, JOIN, ORDER BY, and GROUP BY clauses instantly in your browser. No data is stored. Generates ready-to-use CREATE INDEX statements.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "index",
      "advisor",
      "performance",
      "optimize",
      "suggest",
      "database",
    ],
    examples: [
      {
        title: "Query with JOIN and WHERE",
        description:
          "Analyze a query with JOIN and WHERE clauses for index recommendations",
        input:
          "SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed' ORDER BY o.created_at DESC",
        output:
          "Index Advisor Report\n==================================================\nQueries analyzed: 1\nSuggestions: 5\n\n1. [HIGH] orders(status)\n   Reason: Column used in WHERE clause with = operator\n   SQL: CREATE INDEX idx_orders_status ON orders (status);\n\n2. [HIGH] users(id)\n   Reason: Column used in JOIN condition\n   SQL: CREATE INDEX idx_users_id ON users (id);\n\n3. [HIGH] orders(user_id)\n   Reason: Column used in JOIN condition\n   SQL: CREATE INDEX idx_orders_user_id ON orders (user_id);\n\n4. [MEDIUM] orders(created_at)\n   Reason: Columns used in ORDER BY clause\n   SQL: CREATE INDEX idx_orders_created_at ON orders (created_at);\n\n5. [LOW] orders(status, created_at)\n   Reason: Composite index covering WHERE and ORDER BY columns for efficient filtering and sorting\n   SQL: CREATE INDEX idx_orders_status_created_at ON orders (status, created_at);\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
