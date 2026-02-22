import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL query to analyze for index suggestions"),
});
const outputSchema = z.object({
  output: z.string().describe("Index suggestions"),
});

interface Suggestion {
  table: string;
  columns: string[];
  reason: string;
  sql: string;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const clean = text
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();
  const upper = clean.toUpperCase();
  const suggestions: Suggestion[] = [];

  // Extract table names from FROM/JOIN
  const tables: string[] = [];
  const fromMatches = clean.matchAll(/(?:FROM|JOIN)\s+(\w+)/gi);
  for (const m of fromMatches) tables.push(m[1]!);

  // Extract WHERE columns
  const whereMatch = clean.match(
    /WHERE\s+(.*?)(?:GROUP BY|ORDER BY|LIMIT|HAVING|$)/is
  );
  if (whereMatch) {
    const whereCols: string[] = [];
    const condMatches = whereMatch[1]!.matchAll(
      /(\w+)\s*(?:=|>|<|>=|<=|!=|<>|LIKE|IN|BETWEEN)/gi
    );
    for (const m of condMatches) whereCols.push(m[1]!);
    if (whereCols.length > 0 && tables.length > 0) {
      const table = tables[0]!;
      suggestions.push({
        table,
        columns: whereCols,
        reason: "Columns used in WHERE clause conditions",
        sql: `CREATE INDEX idx_${table}_${whereCols.join("_")} ON ${table} (${whereCols.join(", ")});`,
      });
    }
  }

  // Extract ORDER BY columns
  const orderMatch = clean.match(/ORDER BY\s+(.*?)(?:LIMIT|OFFSET|$)/is);
  if (orderMatch) {
    const orderCols = orderMatch[1]!
      .split(",")
      .map((c) => c.trim().split(/\s+/)[0]!)
      .filter(Boolean);
    if (orderCols.length > 0 && tables.length > 0) {
      const table = tables[0]!;
      suggestions.push({
        table,
        columns: orderCols,
        reason: "Columns used in ORDER BY clause",
        sql: `CREATE INDEX idx_${table}_${orderCols.join("_")} ON ${table} (${orderCols.join(", ")});`,
      });
    }
  }

  // Extract GROUP BY columns
  const groupMatch = clean.match(
    /GROUP BY\s+(.*?)(?:HAVING|ORDER BY|LIMIT|$)/is
  );
  if (groupMatch) {
    const groupCols = groupMatch[1]!
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (groupCols.length > 0 && tables.length > 0) {
      const table = tables[0]!;
      suggestions.push({
        table,
        columns: groupCols,
        reason: "Columns used in GROUP BY clause",
        sql: `CREATE INDEX idx_${table}_${groupCols.join("_")} ON ${table} (${groupCols.join(", ")});`,
      });
    }
  }

  // Extract JOIN ON columns
  const joinOnMatches = clean.matchAll(
    /JOIN\s+(\w+)\s+(?:\w+\s+)?ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi
  );
  for (const m of joinOnMatches) {
    suggestions.push({
      table: m[1]!,
      columns: [m[5]!],
      reason: `Join condition between ${m[2]}.${m[3]} and ${m[4]}.${m[5]}`,
      sql: `CREATE INDEX idx_${m[1]}_${m[5]} ON ${m[1]} (${m[5]});`,
    });
  }

  // Check for LIKE with leading wildcard
  if (upper.includes("LIKE '%") || upper.includes('LIKE "%')) {
    suggestions.push({
      table: tables[0] ?? "table",
      columns: [],
      reason:
        "WARNING: Leading wildcard in LIKE prevents index usage. Consider full-text search instead.",
      sql: "-- Consider using full-text search (e.g., PostgreSQL tsvector, MySQL FULLTEXT INDEX)",
    });
  }

  // Check for function on indexed column
  if (/WHERE\s+\w+\s*\(\s*\w+\s*\)/i.test(clean)) {
    suggestions.push({
      table: tables[0] ?? "table",
      columns: [],
      reason:
        "WARNING: Function call on column in WHERE clause prevents index usage. Consider a functional/expression index.",
      sql: "-- Consider expression index: CREATE INDEX idx_expr ON table (function(column));",
    });
  }

  if (suggestions.length === 0) {
    return {
      output:
        "-- No index suggestions found for this query.\n-- The query may already be optimized or may not benefit from additional indexes.",
    };
  }

  const lines = [
    "-- Index Suggestions",
    `-- Analyzed query: ${clean.substring(0, 80)}${clean.length > 80 ? "..." : ""}`,
    "",
  ];
  for (let i = 0; i < suggestions.length; i++) {
    const s = suggestions[i]!;
    lines.push(`-- Suggestion ${i + 1}: ${s.reason}`);
    if (s.columns.length > 0)
      lines.push(`-- Table: ${s.table}, Columns: ${s.columns.join(", ")}`);
    lines.push(s.sql);
    lines.push("");
  }

  return { output: lines.join("\n") };
}

export const sqlIndexSuggester = defineTool({
  meta: {
    id: "sql/sql-index-suggester",
    name: "SQL Index Suggester",
    description:
      "Free online SQL index suggester — analyze queries and recommend CREATE INDEX statements for WHERE, JOIN, and ORDER BY columns instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "index",
      "suggest",
      "optimize",
      "performance",
      "database",
    ],
    examples: [
      {
        title: "Analyze Query for Indexes",
        description:
          "Suggest indexes for a query filtering and sorting on multiple columns",
        input:
          "SELECT * FROM products WHERE category = 'Electronics' AND price > 100 ORDER BY rating DESC",
        output:
          "-- Index Suggestions\n-- Analyzed query: SELECT * FROM products WHERE category = 'Electronics' AND price > 100 ORDER BY r...\n\n-- Suggestion 1: Columns used in WHERE clause conditions\n-- Table: products, Columns: category, price\nCREATE INDEX idx_products_category_price ON products (category, price);\n\n-- Suggestion 2: Columns used in ORDER BY clause\n-- Table: products, Columns: rating\nCREATE INDEX idx_products_rating ON products (rating);\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
