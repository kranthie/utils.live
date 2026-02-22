import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL query to explain"),
});
const outputSchema = z.object({
  output: z.string().describe("Plain English explanation"),
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
  const parts: string[] = [];

  if (upper.startsWith("SELECT")) {
    parts.push("This query retrieves data:");
    const fromMatch = clean.match(/FROM\s+(\S+)/i);
    const colsEnd = upper.indexOf(" FROM ");
    if (colsEnd > 0) {
      const cols = clean.substring(7, colsEnd).trim();
      if (cols === "*") parts.push("- Selects ALL columns");
      else {
        const colList = cols.split(",").map((c) => c.trim());
        parts.push(
          `- Selects ${colList.length} column(s): ${colList.join(", ")}`
        );
      }
    }
    if (fromMatch) parts.push(`- From the "${fromMatch[1]!}" table`);
    const joins = [
      ...clean.matchAll(/(LEFT|RIGHT|INNER|FULL|CROSS)?\s*JOIN\s+(\S+)/gi),
    ];
    for (const j of joins)
      parts.push(`- ${(j[1] || "INNER").toUpperCase()} JOINs with "${j[2]!}"`);
    if (upper.includes(" WHERE ")) {
      const w = clean.match(
        /WHERE\s+(.*?)(?:GROUP BY|ORDER BY|LIMIT|HAVING|$)/is
      );
      if (w) parts.push(`- Filters rows where: ${w[1]!.trim()}`);
    }
    if (upper.includes("GROUP BY")) {
      const g = clean.match(/GROUP BY\s+(.*?)(?:ORDER BY|LIMIT|HAVING|$)/is);
      if (g) parts.push(`- Groups results by: ${g[1]!.trim()}`);
    }
    if (upper.includes("HAVING")) {
      const h = clean.match(/HAVING\s+(.*?)(?:ORDER BY|LIMIT|$)/is);
      if (h) parts.push(`- Filters groups where: ${h[1]!.trim()}`);
    }
    if (upper.includes("ORDER BY")) {
      const o = clean.match(/ORDER BY\s+(.*?)(?:LIMIT|$)/is);
      if (o) parts.push(`- Orders results by: ${o[1]!.trim()}`);
    }
    if (upper.includes("LIMIT")) {
      const l = clean.match(/LIMIT\s+(\d+)/i);
      if (l) parts.push(`- Limits to ${l[1]!} row(s)`);
    }
    if (upper.includes("DISTINCT"))
      parts.push("- Returns only unique/distinct rows");
  } else if (upper.startsWith("INSERT")) {
    parts.push("This query inserts data:");
    const t = clean.match(/INSERT\s+INTO\s+(\S+)/i);
    if (t) parts.push(`- Into the "${t[1]!}" table`);
    const vals = clean.match(/VALUES\s*\((.*)\)/is);
    if (vals) {
      const count = vals[1]!.split("),").length;
      parts.push(`- Inserts ${count} row(s)`);
    }
  } else if (upper.startsWith("UPDATE")) {
    parts.push("This query updates data:");
    const t = clean.match(/UPDATE\s+(\S+)/i);
    if (t) parts.push(`- Updates the "${t[1]!}" table`);
    if (upper.includes("SET")) {
      const s = clean.match(/SET\s+(.*?)(?:WHERE|$)/is);
      if (s) parts.push(`- Sets: ${s[1]!.trim()}`);
    }
    if (upper.includes("WHERE")) {
      const w = clean.match(/WHERE\s+(.*)/is);
      if (w) parts.push(`- Where: ${w[1]!.trim()}`);
    } else parts.push("- WARNING: No WHERE clause - ALL rows will be updated!");
  } else if (upper.startsWith("DELETE")) {
    parts.push("This query deletes data:");
    const t = clean.match(/DELETE\s+FROM\s+(\S+)/i);
    if (t) parts.push(`- From the "${t[1]!}" table`);
    if (upper.includes("WHERE")) {
      const w = clean.match(/WHERE\s+(.*)/is);
      if (w) parts.push(`- Where: ${w[1]!.trim()}`);
    } else parts.push("- WARNING: No WHERE clause - ALL rows will be deleted!");
  } else if (upper.startsWith("CREATE TABLE")) {
    parts.push("This query creates a new table:");
    const t = clean.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i);
    if (t) parts.push(`- Table name: "${t[1]!}"`);
    if (upper.includes("IF NOT EXISTS"))
      parts.push("- Only if it doesn't already exist");
  } else if (upper.startsWith("ALTER TABLE")) {
    parts.push("This query modifies a table structure:");
    const t = clean.match(/ALTER\s+TABLE\s+(\S+)/i);
    if (t) parts.push(`- Table: "${t[1]!}"`);
  } else if (upper.startsWith("DROP TABLE")) {
    parts.push("This query DELETES an entire table:");
    const t = clean.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\S+)/i);
    if (t) parts.push(`- Table: "${t[1]!}" - THIS IS IRREVERSIBLE!`);
  } else {
    parts.push(`This is a ${clean.split(/\s/)[0]!.toUpperCase()} statement.`);
  }

  return { output: parts.join("\n") };
}

export const sqlExplainer = defineTool({
  meta: {
    id: "sql/sql-explainer",
    name: "SQL Explainer",
    description:
      "Free online SQL explainer — translate SQL queries into plain English descriptions with clause-by-clause breakdown instantly in your browser. No data is stored. Explains SELECT, JOIN, WHERE, GROUP BY, and subqueries.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "explain", "describe", "understand", "plain english"],
    ui: { inputLanguage: "sql" },
    examples: [
      {
        title: "Explain SELECT with JOIN",
        description:
          "Get a plain English explanation of a SELECT query with JOIN and WHERE",
        input:
          "SELECT u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.active = true GROUP BY u.name HAVING COUNT(o.id) > 5 ORDER BY order_count DESC LIMIT 10",
        output:
          'This query retrieves data:\n- Selects 2 column(s): u.name, COUNT(o.id) as order_count\n- From the "users" table\n- LEFT JOINs with "orders"\n- Filters rows where: u.active = true\n- Groups results by: u.name\n- Filters groups where: COUNT(o.id) > 5\n- Orders results by: order_count DESC\n- Limits to 10 row(s)',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
