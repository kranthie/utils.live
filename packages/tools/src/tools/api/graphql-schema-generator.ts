import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON data to generate GraphQL schema from"),
});

const optionsSchema = z.object({
  rootName: z.string().default("Root").describe("Name of the root type"),
  addQueries: z.boolean().default(true).describe("Generate Query type"),
  addMutations: z.boolean().default(false).describe("Generate Mutation type"),
  nonNullByDefault: z
    .boolean()
    .default(false)
    .describe("Mark fields as non-null by default"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated GraphQL schema"),
});

function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]/g, "_")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function inferGraphqlType(
  value: unknown,
  name: string,
  types: Map<string, string>,
  nonNull: boolean
): string {
  const suffix = nonNull ? "!" : "";
  if (value === null) return "String";
  switch (typeof value) {
    case "string": {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return `DateTime${suffix}`;
      if (/^[\w.+-]+@/.test(value)) return `String${suffix}`;
      return `String${suffix}`;
    }
    case "number":
      return Number.isInteger(value) ? `Int${suffix}` : `Float${suffix}`;
    case "boolean":
      return `Boolean${suffix}`;
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return `[String]${suffix}`;
        const first = value[0] as unknown;
        if (
          first !== null &&
          typeof first === "object" &&
          !Array.isArray(first)
        ) {
          const merged: Record<string, unknown> = {};
          for (const item of value) {
            if (item && typeof item === "object") {
              for (const [k, v] of Object.entries(
                item as Record<string, unknown>
              )) {
                if (!(k in merged)) merged[k] = v;
              }
            }
          }
          const typeName = toPascalCase(name);
          generateType(merged, typeName, types, nonNull);
          return `[${typeName}]${suffix}`;
        }
        const itemType = inferGraphqlType(first, name, types, nonNull);
        return `[${itemType}]${suffix}`;
      }
      const typeName = toPascalCase(name);
      generateType(value as Record<string, unknown>, typeName, types, nonNull);
      return `${typeName}${suffix}`;
    }
    default:
      return `String${suffix}`;
  }
}

function generateType(
  obj: Record<string, unknown>,
  name: string,
  types: Map<string, string>,
  nonNull: boolean
): void {
  if (types.has(name)) return;
  types.set(name, "");

  const fields: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const gqlType = inferGraphqlType(value, key, types, nonNull);
    fields.push(`  ${key}: ${gqlType}`);
  }

  types.set(name, `type ${name} {\n${fields.join("\n")}\n}`);
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const rootName = options?.rootName ?? "Root";
  const addQueries = options?.addQueries ?? true;
  const addMutations = options?.addMutations ?? false;
  const nonNull = options?.nonNullByDefault ?? false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const types = new Map<string, string>();

  if (
    Array.isArray(parsed) &&
    parsed.length > 0 &&
    typeof parsed[0] === "object"
  ) {
    const merged: Record<string, unknown> = {};
    for (const item of parsed) {
      if (item && typeof item === "object") {
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          if (!(k in merged)) merged[k] = v;
        }
      }
    }
    generateType(merged, rootName, types, nonNull);
  } else if (
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed)
  ) {
    generateType(parsed as Record<string, unknown>, rootName, types, nonNull);
  } else {
    return {
      output: `# Scalar type inferred from JSON primitive\nscalar ${rootName}`,
    };
  }

  const lines: string[] = ["# Generated GraphQL Schema", ""];
  const entries = [...types.values()].reverse();
  lines.push(entries.join("\n\n"));

  const lower = rootName.charAt(0).toLowerCase() + rootName.slice(1);

  if (addQueries) {
    lines.push("");
    lines.push("type Query {");
    lines.push(`  ${lower}(id: ID!): ${rootName}`);
    lines.push(`  ${lower}s(limit: Int, offset: Int): [${rootName}!]!`);
    lines.push("}");
  }

  if (addMutations) {
    lines.push("");
    lines.push("type Mutation {");
    lines.push(
      `  create${rootName}(input: Create${rootName}Input!): ${rootName}!`
    );
    lines.push(
      `  update${rootName}(id: ID!, input: Update${rootName}Input!): ${rootName}!`
    );
    lines.push(`  delete${rootName}(id: ID!): Boolean!`);
    lines.push("}");
  }

  return { output: lines.join("\n") };
}

export const graphqlSchemaGenerator = defineTool({
  meta: {
    id: "api/graphql-schema-generator",
    name: "GraphQL Schema Generator",
    description:
      "Free online GraphQL schema generator — create GraphQL type definitions from JSON data instantly in your browser. No data is stored. Infers types from sample data and optionally generates Query and Mutation root types.",
    category: "api",
    subgroup: "GraphQL",
    tier: ToolTier.CLIENT,
    keywords: [
      "graphql",
      "schema",
      "generate",
      "json",
      "api",
      "types",
      "sdl",
      "codegen",
    ],
    ui: { inputLanguage: "json", outputLanguage: "graphql" },
    examples: [
      {
        title: "Schema from User JSON",
        description: "Generate a GraphQL schema from a sample user JSON object",
        input:
          '{"id":1,"name":"Alice","email":"alice@example.com","active":true,"age":30}',
        output:
          "# Generated GraphQL Schema\n\ntype Root {\n  id: Int\n  name: String\n  email: String\n  active: Boolean\n  age: Int\n}\n\ntype Query {\n  root(id: ID!): Root\n  roots(limit: Int, offset: Int): [Root!]!\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
