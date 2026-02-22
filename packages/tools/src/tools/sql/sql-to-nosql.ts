import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL query to convert"),
});
const outputSchema = z.object({
  output: z.string().describe("MongoDB-style query"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const clean = text.replace(/--.*$/gm, "").replace(/\s+/g, " ").trim();
  const upper = clean.toUpperCase();

  if (upper.startsWith("SELECT")) {
    const table = clean.match(/FROM\s+(\S+)/i)?.[1] ?? "collection";
    const colsEnd = upper.indexOf(" FROM ");
    let projection = "";
    if (colsEnd > 0) {
      const cols = clean.substring(7, colsEnd).trim();
      if (cols !== "*") {
        const fields = cols.split(",").map(
          (c) =>
            `"${c
              .trim()
              .split(/\s+AS\s+/i)[0]!
              .trim()}": 1`
        );
        projection = `, { ${fields.join(", ")} }`;
      }
    }
    let filter = "{}";
    const whereMatch = clean.match(
      /WHERE\s+(.*?)(?:GROUP BY|ORDER BY|LIMIT|$)/is
    );
    if (whereMatch) {
      let where = whereMatch[1]!.trim();
      where = where.replace(/(\w+)\s*=\s*'([^']+)'/g, '"$1": "$2"');
      where = where.replace(/(\w+)\s*=\s*(\d+)/g, '"$1": $2');
      where = where.replace(/(\w+)\s*>\s*(\d+)/g, '"$1": { "$gt": $2 }');
      where = where.replace(/(\w+)\s*<\s*(\d+)/g, '"$1": { "$lt": $2 }');
      where = where.replace(/(\w+)\s*>=\s*(\d+)/g, '"$1": { "$gte": $2 }');
      where = where.replace(/(\w+)\s*<=\s*(\d+)/g, '"$1": { "$lte": $2 }');
      where = where.replace(/(\w+)\s*!=\s*'([^']+)'/g, '"$1": { "$ne": "$2" }');
      where = where.replace(
        /(\w+)\s+LIKE\s+'%([^']+)%'/gi,
        '"$1": { "$regex": "$2" }'
      );
      where = where.replace(/(\w+)\s+IN\s*\(([^)]+)\)/gi, (_, field, vals) => {
        return `"${field}": { "$in": [${vals}] }`;
      });
      where = where.replace(/\s+AND\s+/gi, ", ");
      filter = `{ ${where} }`;
    }
    let sort = "";
    const orderMatch = clean.match(/ORDER BY\s+(\w+)\s*(ASC|DESC)?/i);
    if (orderMatch)
      sort = `.sort({ "${orderMatch[1]!}": ${(orderMatch[2] ?? "ASC").toUpperCase() === "DESC" ? -1 : 1} })`;
    let limit = "";
    const limitMatch = clean.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) limit = `.limit(${limitMatch[1]!})`;
    const offsetMatch = clean.match(/OFFSET\s+(\d+)/i);
    const skip = offsetMatch ? `.skip(${offsetMatch[1]!})` : "";

    return {
      output: `db.${table}.find(${filter}${projection})${sort}${skip}${limit}`,
    };
  }

  if (upper.startsWith("INSERT")) {
    const table = clean.match(/INSERT\s+INTO\s+(\S+)/i)?.[1] ?? "collection";
    const colsMatch = clean.match(/\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (colsMatch) {
      const cols = colsMatch[1]!.split(",").map((c) => c.trim());
      const vals = colsMatch[2]!.split(",").map((v) => v.trim());
      const doc = cols.map((c, i) => `"${c}": ${vals[i]}`).join(", ");
      return { output: `db.${table}.insertOne({ ${doc} })` };
    }
    return { output: `db.${table}.insertOne({ /* data */ })` };
  }

  if (upper.startsWith("UPDATE")) {
    const table = clean.match(/UPDATE\s+(\S+)/i)?.[1] ?? "collection";
    const setMatch = clean.match(/SET\s+(.*?)(?:WHERE|$)/is);
    let update = "{}";
    if (setMatch) {
      const sets = setMatch[1]!
        .trim()
        .replace(/(\w+)\s*=\s*/g, '"$1": ')
        .replace(/,/g, ", ");
      update = `{ "$set": { ${sets} } }`;
    }
    const whereMatch = clean.match(/WHERE\s+(.*)/is);
    let filter = "{}";
    if (whereMatch) {
      filter = `{ ${whereMatch[1]!
        .trim()
        .replace(/(\w+)\s*=\s*'([^']+)'/g, '"$1": "$2"')
        .replace(/(\w+)\s*=\s*(\d+)/g, '"$1": $2')
        .replace(/\s+AND\s+/gi, ", ")} }`;
    }
    return { output: `db.${table}.updateMany(${filter}, ${update})` };
  }

  if (upper.startsWith("DELETE")) {
    const table = clean.match(/DELETE\s+FROM\s+(\S+)/i)?.[1] ?? "collection";
    const whereMatch = clean.match(/WHERE\s+(.*)/is);
    let filter = "{}";
    if (whereMatch) {
      filter = `{ ${whereMatch[1]!
        .trim()
        .replace(/(\w+)\s*=\s*'([^']+)'/g, '"$1": "$2"')
        .replace(/(\w+)\s*=\s*(\d+)/g, '"$1": $2')
        .replace(/\s+AND\s+/gi, ", ")} }`;
    }
    return { output: `db.${table}.deleteMany(${filter})` };
  }

  return {
    output: `// Unsupported SQL statement type. Manual conversion required.\n// Original: ${clean}`,
  };
}

export const sqlToNosql = defineTool({
  meta: {
    id: "sql/sql-to-nosql",
    name: "SQL to NoSQL",
    description:
      "Free online SQL to NoSQL converter — transform SQL SELECT queries into MongoDB-style find, sort, and limit query syntax instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "nosql", "mongodb", "convert", "query"],
    ui: { inputLanguage: "sql", outputLanguage: "javascript" },
    examples: [
      {
        title: "SELECT to MongoDB Find",
        description:
          "Convert a SQL SELECT with WHERE clause to MongoDB query syntax",
        input:
          "SELECT name, email FROM users WHERE age > 25 AND active = true ORDER BY name ASC LIMIT 10",
        output:
          'db.users.find({ "age": { "$gt": 25 }, active = true }, { "name": 1, "email": 1 }).sort({ "name": 1 }).limit(10)',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
