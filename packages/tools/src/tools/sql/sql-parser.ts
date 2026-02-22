import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL query to parse"),
});
const outputSchema = z.object({
  output: z.string().describe("Parsed SQL structure in JSON"),
});

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

  const result: Record<string, unknown> = {};

  if (upper.startsWith("SELECT")) {
    result.type = "SELECT";
    // Extract columns
    const fromIdx = upper.indexOf(" FROM ");
    if (fromIdx > 0) {
      const cols = clean.substring(7, fromIdx).trim();
      result.columns = cols.split(",").map((c) => c.trim());
    }
    // Extract table
    const fromMatch = clean.match(/FROM\s+(\S+)/i);
    if (fromMatch) result.table = fromMatch[1]!;
    // Extract joins
    const joins = [
      ...clean.matchAll(
        /(\w+\s+)?JOIN\s+(\S+)\s+ON\s+([^WHERE|GROUP|ORDER|LIMIT]+)/gi
      ),
    ];
    if (joins.length > 0)
      result.joins = joins.map((j) => ({
        type: (j[1] ?? "INNER").trim(),
        table: j[2]!,
        condition: j[3]!.trim(),
      }));
    // Extract WHERE
    const whereMatch = clean.match(
      /WHERE\s+(.*?)(?:GROUP BY|ORDER BY|LIMIT|HAVING|$)/is
    );
    if (whereMatch) result.where = whereMatch[1]!.trim();
    // Group By
    const groupMatch = clean.match(
      /GROUP BY\s+(.*?)(?:ORDER BY|LIMIT|HAVING|$)/is
    );
    if (groupMatch)
      result.groupBy = groupMatch[1]!
        .trim()
        .split(",")
        .map((g) => g.trim());
    // Order By
    const orderMatch = clean.match(/ORDER BY\s+(.*?)(?:LIMIT|$)/is);
    if (orderMatch)
      result.orderBy = orderMatch[1]!
        .trim()
        .split(",")
        .map((o) => o.trim());
    // Limit
    const limitMatch = clean.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) result.limit = parseInt(limitMatch[1]!, 10);
    const offsetMatch = clean.match(/OFFSET\s+(\d+)/i);
    if (offsetMatch) result.offset = parseInt(offsetMatch[1]!, 10);
  } else if (upper.startsWith("INSERT")) {
    result.type = "INSERT";
    const tableMatch = clean.match(/INSERT\s+INTO\s+(\S+)/i);
    if (tableMatch) result.table = tableMatch[1]!;
    const colsMatch = clean.match(/\(([^)]+)\)\s*VALUES/i);
    if (colsMatch)
      result.columns = colsMatch[1]!.split(",").map((c) => c.trim());
  } else if (upper.startsWith("UPDATE")) {
    result.type = "UPDATE";
    const tableMatch = clean.match(/UPDATE\s+(\S+)/i);
    if (tableMatch) result.table = tableMatch[1]!;
    const setMatch = clean.match(/SET\s+(.*?)(?:WHERE|$)/is);
    if (setMatch)
      result.set = setMatch[1]!
        .trim()
        .split(",")
        .map((s) => s.trim());
    const whereMatch = clean.match(/WHERE\s+(.*)/is);
    if (whereMatch) result.where = whereMatch[1]!.trim();
  } else if (upper.startsWith("DELETE")) {
    result.type = "DELETE";
    const tableMatch = clean.match(/DELETE\s+FROM\s+(\S+)/i);
    if (tableMatch) result.table = tableMatch[1]!;
    const whereMatch = clean.match(/WHERE\s+(.*)/is);
    if (whereMatch) result.where = whereMatch[1]!.trim();
  } else if (upper.startsWith("CREATE TABLE")) {
    result.type = "CREATE TABLE";
    const tableMatch = clean.match(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i
    );
    if (tableMatch) result.table = tableMatch[1]!;
  } else {
    result.type = "UNKNOWN";
    result.raw = clean;
  }

  return { output: JSON.stringify(result, null, 2) };
}

export const sqlParser = defineTool({
  meta: {
    id: "sql/sql-parser",
    name: "SQL Parser",
    description:
      "Free online SQL parser — parse SQL queries into structured AST-like JSON with columns, tables, conditions, and clauses instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "parse", "ast", "structure", "analyze"],
    ui: { inputLanguage: "sql", outputLanguage: "json" },
    examples: [
      {
        title: "Parse SELECT Query",
        description: "Parse a SELECT query into its structural components",
        input:
          "SELECT name, email FROM users WHERE active = true ORDER BY name ASC LIMIT 10",
        output:
          '{\n  "type": "SELECT",\n  "columns": [\n    "name",\n    "email"\n  ],\n  "table": "users",\n  "where": "active = true",\n  "orderBy": [\n    "name ASC"\n  ],\n  "limit": 10\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
