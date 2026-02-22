import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("GraphQL schema definition"),
});

const optionsSchema = z.object({
  exportTypes: z.boolean().default(true).describe("Export all types"),
  readonlyTypes: z
    .boolean()
    .default(false)
    .describe("Make properties readonly"),
  addNullable: z
    .boolean()
    .default(true)
    .describe("Mark nullable fields as optional"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated TypeScript types"),
});

function mapGraphqlType(type: string, nullable: boolean): string {
  const base = type.replace(/!/g, "").replace(/\[|\]/g, "");
  let tsType: string;
  switch (base) {
    case "String":
    case "ID":
      tsType = "string";
      break;
    case "Int":
    case "Float":
      tsType = "number";
      break;
    case "Boolean":
      tsType = "boolean";
      break;
    case "DateTime":
    case "Date":
      tsType = "string";
      break;
    case "JSON":
      tsType = "Record<string, unknown>";
      break;
    default:
      tsType = base;
  }

  if (type.startsWith("[")) {
    const inner = type.slice(1, type.lastIndexOf("]"));
    const innerType = mapGraphqlType(inner, !inner.endsWith("!"));
    tsType = `${innerType}[]`;
  }

  if (nullable) tsType += " | null";
  return tsType;
}

interface GqlField {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}
interface GqlType {
  kind: string;
  name: string;
  fields: GqlField[];
  values?: string[];
  description?: string;
}

function parseSchema(input: string): GqlType[] {
  const types: GqlType[] = [];
  // Simple regex-based parser for common GraphQL schema patterns
  const typeRegex =
    /(?:#\s*(.*?)\n\s*)?(?:"""[\s\S]*?"""\s*)?(type|input|interface|enum|scalar)\s+(\w+)(?:\s+implements\s+[\w\s&,]+)?\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = typeRegex.exec(input)) !== null) {
    const kind = match[2]!;
    const name = match[3]!;
    const body = match[4]!;

    if (kind === "enum") {
      const values = body
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#") && !l.startsWith('"""'));
      types.push({ kind, name, fields: [], values });
      continue;
    }

    const fields: GqlField[] = [];
    const fieldLines = body.split("\n");
    for (const line of fieldLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith('"""'))
        continue;
      // field: Type or field(args): Type
      const fieldMatch = trimmed.match(/^(\w+)(?:\([^)]*\))?\s*:\s*(.+?)$/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1]!;
        let fieldType = fieldMatch[2]!.trim();
        // Remove trailing comments
        const commentIdx = fieldType.indexOf("#");
        if (commentIdx > 0)
          fieldType = fieldType.substring(0, commentIdx).trim();
        // Remove directives
        const directiveIdx = fieldType.indexOf("@");
        if (directiveIdx > 0)
          fieldType = fieldType.substring(0, directiveIdx).trim();

        const nullable = !fieldType.endsWith("!");
        fields.push({ name: fieldName, type: fieldType, nullable });
      }
    }
    types.push({ kind, name, fields });
  }

  // Handle scalar types
  const scalarRegex = /scalar\s+(\w+)/g;
  while ((match = scalarRegex.exec(input)) !== null) {
    if (!types.find((t) => t.name === match![1])) {
      types.push({ kind: "scalar", name: match[1]!, fields: [] });
    }
  }

  return types;
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const exportKw = (options?.exportTypes ?? true) ? "export " : "";
  const readonly = options?.readonlyTypes ?? false;
  const addNullable = options?.addNullable ?? true;

  const types = parseSchema(text);
  if (types.length === 0) throw new Error("No GraphQL types found in input");

  const lines: string[] = ["// Generated from GraphQL schema", ""];

  for (const type of types) {
    if (type.kind === "scalar") {
      lines.push(`${exportKw}type ${type.name} = string;`);
      lines.push("");
      continue;
    }

    if (type.kind === "enum") {
      lines.push(`${exportKw}enum ${type.name} {`);
      for (const v of type.values ?? []) {
        lines.push(`  ${v} = "${v}",`);
      }
      lines.push("}");
      lines.push("");
      continue;
    }

    lines.push(`${exportKw}interface ${type.name} {`);
    for (const field of type.fields) {
      const tsType = mapGraphqlType(field.type, addNullable && field.nullable);
      const prefix = readonly ? "readonly " : "";
      const optional = addNullable && field.nullable ? "?" : "";
      lines.push(`  ${prefix}${field.name}${optional}: ${tsType};`);
    }
    lines.push("}");
    lines.push("");
  }

  return { output: lines.join("\n").trimEnd() };
}

export const graphqlToTypescript = defineTool({
  meta: {
    id: "api/graphql-to-typescript",
    name: "GraphQL to TypeScript",
    description:
      "Free online GraphQL to TypeScript converter — generate TypeScript interfaces from GraphQL schema definitions instantly in your browser. No data is stored. Maps scalar types, handles nullability, and supports export and readonly options.",
    category: "api",
    subgroup: "GraphQL",
    tier: ToolTier.CLIENT,
    keywords: [
      "graphql",
      "typescript",
      "codegen",
      "types",
      "schema",
      "interface",
      "convert",
      "ts",
    ],
    ui: { inputLanguage: "graphql", outputLanguage: "typescript" },
    examples: [
      {
        title: "Convert User and Post Types",
        description:
          "Generate TypeScript interfaces from GraphQL type definitions",
        input:
          "type User {\n  id: ID!\n  name: String!\n  email: String\n  active: Boolean!\n}\n\ntype Post {\n  id: ID!\n  title: String!\n  author: User!\n}",
        output:
          "// Generated from GraphQL schema\n\nexport interface User {\n  id: string;\n  name: string;\n  email?: string | null;\n  active: boolean;\n}\n\nexport interface Post {\n  id: string;\n  title: string;\n  author: User;\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
