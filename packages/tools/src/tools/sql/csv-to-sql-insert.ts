import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CSV data to convert"),
});
const optionsSchema = z.object({
  tableName: z.string().default("my_table").describe("Table name"),
  delimiter: z.string().default(",").describe("CSV delimiter"),
  hasHeader: z.boolean().default(true).describe("First row is header"),
});
const outputSchema = z.object({
  output: z.string().describe("SQL INSERT statements"),
});

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const table = options?.tableName ?? "my_table";
  const delim = options?.delimiter ?? ",";
  const hasHeader = options?.hasHeader ?? true;

  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) throw new Error("No data found");

  let columns: string[];
  let dataStart: number;
  if (hasHeader) {
    columns = lines[0]!
      .split(delim)
      .map((c) => c.trim().replace(/^["']|["']$/g, ""));
    dataStart = 1;
  } else {
    const numCols = lines[0]!.split(delim).length;
    columns = Array.from({ length: numCols }, (_, i) => `col${i + 1}`);
    dataStart = 0;
  }

  const values: string[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cells = lines[i]!.split(delim).map((c) => {
      const v = c.trim().replace(/^["']|["']$/g, "");
      if (v === "" || v.toUpperCase() === "NULL") return "NULL";
      if (/^-?\d+(\.\d+)?$/.test(v)) return v;
      return `'${v.replace(/'/g, "''")}'`;
    });
    values.push(`(${cells.join(", ")})`);
  }

  if (values.length === 0) throw new Error("No data rows found");

  const output = `INSERT INTO ${table} (${columns.join(", ")})\nVALUES\n  ${values.join(",\n  ")};`;
  return { output };
}

export const csvToSqlInsert = defineTool({
  meta: {
    id: "sql/csv-to-sql-insert",
    name: "CSV to SQL INSERT",
    description:
      "Free online CSV to SQL INSERT converter — transform CSV data into SQL INSERT statements instantly in your browser. No data is stored. Handles quoted values, custom table names, and generates properly escaped SQL.",
    category: "sql",
    subgroup: "Data Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["csv", "sql", "insert", "convert", "import"],
    ui: { outputLanguage: "sql" },
    examples: [
      {
        title: "Employee Data",
        description: "Convert CSV employee data into SQL INSERT statements",
        input: "name,age,department\nAlice,30,Engineering\nBob,25,Marketing",
        output:
          "INSERT INTO my_table (name, age, department)\nVALUES\n  ('Alice', 30, 'Engineering'),\n  ('Bob', 25, 'Marketing');",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
