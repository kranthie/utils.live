import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON array of objects to convert"),
});
const optionsSchema = z.object({
  tableName: z.string().default("my_table").describe("Table name"),
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect"),
  batchSize: z
    .number()
    .min(1)
    .max(1000)
    .default(100)
    .describe("Rows per INSERT statement"),
});
const outputSchema = z.object({
  output: z.string().describe("SQL INSERT statements"),
});

function escapeValue(v: unknown, dialect: string): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean")
    return dialect === "postgresql" ? String(v) : v ? "1" : "0";
  if (typeof v === "object")
    return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v as string).replace(/'/g, "''")}'`;
}

function quoteIdentifier(name: string, dialect: string): string {
  if (dialect === "mysql") return `\`${name}\``;
  if (dialect === "postgresql") return `"${name}"`;
  return name;
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const table = options?.tableName ?? "my_table";
  const dialect = options?.dialect ?? "standard";
  const batchSize = options?.batchSize ?? 100;

  let data: unknown[];
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    data = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    throw new Error("Input must be valid JSON");
  }

  if (data.length === 0) throw new Error("No data to convert");
  if (typeof data[0] !== "object" || data[0] === null)
    throw new Error("JSON must contain objects");

  const allKeys = new Set<string>();
  for (const row of data) {
    if (row && typeof row === "object")
      Object.keys(row).forEach((k) => allKeys.add(k));
  }
  const columns = [...allKeys];
  const quotedCols = columns.map((c) => quoteIdentifier(c, dialect)).join(", ");

  const statements: string[] = [];
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const values = batch.map((row) => {
      const obj = row as Record<string, unknown>;
      const vals = columns.map((c) => escapeValue(obj[c], dialect));
      return `(${vals.join(", ")})`;
    });
    statements.push(
      `INSERT INTO ${quoteIdentifier(table, dialect)} (${quotedCols})\nVALUES\n  ${values.join(",\n  ")};`
    );
  }

  return { output: statements.join("\n\n") };
}

export const jsonToSqlInsert = defineTool({
  meta: {
    id: "sql/json-to-sql-insert",
    name: "JSON to SQL INSERT",
    description:
      "Free online JSON to SQL INSERT converter — transform JSON arrays or objects into SQL INSERT statements instantly in your browser. No data is stored. Auto-detects column names from JSON keys and handles nested values.",
    category: "sql",
    subgroup: "Data Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["json", "sql", "insert", "convert", "generate"],
    ui: { inputLanguage: "json", outputLanguage: "sql" },
    examples: [
      {
        title: "Users JSON to SQL",
        description:
          "Convert a JSON array of user objects into SQL INSERT statements",
        input:
          '[{"name": "Alice", "email": "alice@example.com", "age": 30}, {"name": "Bob", "email": "bob@example.com", "age": 25}]',
        output:
          "INSERT INTO my_table (name, email, age)\nVALUES\n  ('Alice', 'alice@example.com', 30),\n  ('Bob', 'bob@example.com', 25);",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
