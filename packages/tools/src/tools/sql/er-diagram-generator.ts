import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL CREATE TABLE statements"),
});
const optionsSchema = z.object({
  format: z
    .enum(["mermaid", "plantuml", "dbml", "ascii"])
    .default("mermaid")
    .describe("Output diagram format"),
});
const outputSchema = z.object({ output: z.string().describe("ER diagram") });

interface Column {
  name: string;
  type: string;
  pk: boolean;
  fk: boolean;
  nullable: boolean;
  unique: boolean;
  refTable?: string | undefined;
  refColumn?: string | undefined;
}

interface Table {
  name: string;
  columns: Column[];
}

function parseTables(sql: string): Table[] {
  const tables: Table[] = [];
  const createRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\)\s*;/gi;
  let match;

  while ((match = createRegex.exec(sql)) !== null) {
    const tableName = match[1]!;
    const body = match[2]!;
    const columns: Column[] = [];
    const constraints: string[] = [];

    // Split by commas, but not commas inside parentheses
    const parts: string[] = [];
    let depth = 0;
    let current = "";
    for (const ch of body) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
      current += ch;
    }
    if (current.trim()) parts.push(current.trim());

    for (const part of parts) {
      const trimmed = part.trim();
      const upper = trimmed.toUpperCase();

      // Table-level constraints
      if (
        upper.startsWith("PRIMARY KEY") ||
        upper.startsWith("UNIQUE") ||
        upper.startsWith("CHECK") ||
        upper.startsWith("CONSTRAINT") ||
        upper.startsWith("INDEX") ||
        upper.startsWith("KEY")
      ) {
        constraints.push(trimmed);

        // Extract FK references from CONSTRAINT ... FOREIGN KEY ... REFERENCES
        const fkMatch = trimmed.match(
          /FOREIGN\s+KEY\s*\(\s*[`"']?(\w+)[`"']?\s*\)\s*REFERENCES\s+[`"']?(\w+)[`"']?\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i
        );
        if (fkMatch) {
          const col = columns.find((c) => c.name === fkMatch[1]);
          if (col) {
            col.fk = true;
            col.refTable = fkMatch[2];
            col.refColumn = fkMatch[3];
          }
        }

        // Extract PK columns
        const pkMatch = trimmed.match(/PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i);
        if (pkMatch) {
          const pkCols = pkMatch[1]!
            .split(",")
            .map((c) => c.trim().replace(/[`"']/g, ""));
          for (const pkCol of pkCols) {
            const col = columns.find((c) => c.name === pkCol);
            if (col) col.pk = true;
          }
        }
        continue;
      }

      // Column definition
      const colMatch = trimmed.match(
        /^[`"']?(\w+)[`"']?\s+(\w+(?:\s*\([^)]*\))?)/i
      );
      if (colMatch) {
        const col: Column = {
          name: colMatch[1]!,
          type: colMatch[2]!.replace(/\s+/g, ""),
          pk: /PRIMARY\s+KEY/i.test(trimmed),
          fk: false,
          nullable: !/NOT\s+NULL/i.test(trimmed),
          unique: /UNIQUE/i.test(trimmed),
        };

        const refMatch = trimmed.match(
          /REFERENCES\s+[`"']?(\w+)[`"']?\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i
        );
        if (refMatch) {
          col.fk = true;
          col.refTable = refMatch[1];
          col.refColumn = refMatch[2];
        }

        columns.push(col);
      }
    }

    tables.push({ name: tableName, columns });
  }

  return tables;
}

function toMermaid(tables: Table[]): string {
  const lines = ["erDiagram"];

  for (const table of tables) {
    lines.push(`    ${table.name} {`);
    for (const col of table.columns) {
      const markers = [];
      if (col.pk) markers.push("PK");
      if (col.fk) markers.push("FK");
      if (col.unique && !col.pk) markers.push("UK");
      const markerStr = markers.length > 0 ? ` "${markers.join(",")}"` : "";
      lines.push(`        ${col.type} ${col.name}${markerStr}`);
    }
    lines.push("    }");
  }

  // Add relationships
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.fk && col.refTable) {
        lines.push(`    ${col.refTable} ||--o{ ${table.name} : "${col.name}"`);
      }
    }
  }

  return lines.join("\n");
}

function toPlantUML(tables: Table[]): string {
  const lines = ["@startuml"];

  for (const table of tables) {
    lines.push(`entity "${table.name}" {`);
    const pkCols = table.columns.filter((c) => c.pk);
    const otherCols = table.columns.filter((c) => !c.pk);
    for (const col of pkCols) {
      lines.push(`  * ${col.name} : ${col.type} <<PK>>`);
    }
    if (pkCols.length > 0 && otherCols.length > 0) lines.push("  --");
    for (const col of otherCols) {
      const nn = col.nullable ? "" : " <<NOT NULL>>";
      const fk = col.fk ? " <<FK>>" : "";
      lines.push(`  ${col.name} : ${col.type}${nn}${fk}`);
    }
    lines.push("}");
    lines.push("");
  }

  for (const table of tables) {
    for (const col of table.columns) {
      if (col.fk && col.refTable) {
        lines.push(`${col.refTable} ||--o{ ${table.name}`);
      }
    }
  }

  lines.push("@enduml");
  return lines.join("\n");
}

function toDbml(tables: Table[]): string {
  const lines: string[] = [];

  for (const table of tables) {
    lines.push(`Table ${table.name} {`);
    for (const col of table.columns) {
      const settings: string[] = [];
      if (col.pk) settings.push("pk");
      if (!col.nullable) settings.push("not null");
      if (col.unique && !col.pk) settings.push("unique");
      if (col.fk && col.refTable && col.refColumn)
        settings.push(`ref: > ${col.refTable}.${col.refColumn}`);
      const settingsStr =
        settings.length > 0 ? ` [${settings.join(", ")}]` : "";
      lines.push(`  ${col.name} ${col.type}${settingsStr}`);
    }
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}

function toAscii(tables: Table[]): string {
  const lines: string[] = [];

  for (const table of tables) {
    const maxNameLen = Math.max(...table.columns.map((c) => c.name.length), 4);
    const maxTypeLen = Math.max(...table.columns.map((c) => c.type.length), 4);
    const width = maxNameLen + maxTypeLen + 15;
    const border = "+" + "-".repeat(width) + "+";

    lines.push(border);
    lines.push(`| ${table.name.toUpperCase().padEnd(width - 1)}|`);
    lines.push(border);

    for (const col of table.columns) {
      const pk = col.pk ? "PK" : "  ";
      const fk = col.fk ? "FK" : "  ";
      const nn = col.nullable ? "  " : "NN";
      const line = ` ${pk} ${fk} ${nn} ${col.name.padEnd(maxNameLen)} ${col.type.padEnd(maxTypeLen)}`;
      lines.push(`|${line.padEnd(width)}|`);
    }
    lines.push(border);
    lines.push("");
  }

  // Relationships
  const rels: string[] = [];
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.fk && col.refTable) {
        rels.push(
          `${table.name}.${col.name} -> ${col.refTable}.${col.refColumn ?? "id"}`
        );
      }
    }
  }
  if (rels.length > 0) {
    lines.push("Relationships:");
    for (const r of rels) lines.push(`  ${r}`);
  }

  return lines.join("\n");
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const format = options?.format ?? "mermaid";

  const tables = parseTables(text);
  if (tables.length === 0)
    throw new Error("No CREATE TABLE statements found in input");

  switch (format) {
    case "mermaid":
      return { output: toMermaid(tables) };
    case "plantuml":
      return { output: toPlantUML(tables) };
    case "dbml":
      return { output: toDbml(tables) };
    case "ascii":
      return { output: toAscii(tables) };
  }

  return { output: toMermaid(tables) };
}

export const erDiagramGenerator = defineTool({
  meta: {
    id: "sql/er-diagram-generator",
    name: "ER Diagram Generator",
    description:
      "Free online ER diagram generator — create entity-relationship diagrams from SQL CREATE TABLE statements instantly in your browser. No data is stored. Generates Mermaid diagram syntax with tables, columns, types, and relationships.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "er",
      "diagram",
      "entity",
      "relationship",
      "schema",
      "mermaid",
      "plantuml",
      "dbml",
    ],
    ui: { outputRenderer: "diagram" as const },
    examples: [
      {
        title: "Blog Schema",
        description: "Generate an ER diagram from users and posts tables",
        input:
          "CREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE posts (\n  id INTEGER PRIMARY KEY,\n  title VARCHAR(255),\n  user_id INTEGER REFERENCES users(id)\n);",
        output:
          'erDiagram\n    users {\n        INTEGER id "PK"\n        VARCHAR(100) name\n    }\n    posts {\n        INTEGER id "PK"\n        VARCHAR(255) title\n        INTEGER user_id "FK"\n    }\n    users ||--o{ posts : "user_id"',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
