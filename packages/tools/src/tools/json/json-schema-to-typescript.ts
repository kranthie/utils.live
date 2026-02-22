import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON Schema to generate TypeScript types from"),
});

const optionsSchema = z.object({
  exportTypes: z.boolean().default(true).describe("Export all types"),
  rootName: z.string().default("Root").describe("Name for the root type"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated TypeScript types"),
});

function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]/g, "_")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function schemaToTs(
  schema: Record<string, unknown>,
  name: string,
  definitions: Map<string, string>,
  exportKw: string
): string {
  if (schema.$ref) {
    const ref = schema.$ref as string;
    const refName = ref.split("/").pop() ?? "Unknown";
    return toPascalCase(refName);
  }

  if (schema.enum) {
    const values = (schema.enum as unknown[]).map((v) =>
      typeof v === "string" ? `"${v}"` : String(v)
    );
    return values.join(" | ");
  }

  if (schema.oneOf || schema.anyOf) {
    const items = (schema.oneOf ?? schema.anyOf) as Record<string, unknown>[];
    return items
      .map((s, i) => schemaToTs(s, `${name}Option${i}`, definitions, exportKw))
      .join(" | ");
  }

  if (schema.allOf) {
    const items = schema.allOf as Record<string, unknown>[];
    return items
      .map((s, i) => schemaToTs(s, `${name}Part${i}`, definitions, exportKw))
      .join(" & ");
  }

  const type = schema.type as string | string[] | undefined;

  if (Array.isArray(type)) {
    return type
      .map((t) =>
        schemaToTs({ ...schema, type: t }, name, definitions, exportKw)
      )
      .join(" | ");
  }

  switch (type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      if (items) {
        const itemType = schemaToTs(
          items,
          `${name}Item`,
          definitions,
          exportKw
        );
        return `${itemType}[]`;
      }
      return "unknown[]";
    }
    case "object": {
      const properties = schema.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!properties) {
        const additionalProps = schema.additionalProperties;
        if (additionalProps && typeof additionalProps === "object") {
          const valueType = schemaToTs(
            additionalProps as Record<string, unknown>,
            `${name}Value`,
            definitions,
            exportKw
          );
          return `Record<string, ${valueType}>`;
        }
        return "Record<string, unknown>";
      }
      const required = new Set((schema.required as string[] | undefined) ?? []);
      const fields: string[] = [];
      for (const [key, propSchema] of Object.entries(properties)) {
        const propType = schemaToTs(
          propSchema,
          toPascalCase(key),
          definitions,
          exportKw
        );
        const opt = required.has(key) ? "" : "?";
        const desc = propSchema.description
          ? `  /** ${propSchema.description as string} */\n`
          : "";
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
          ? key
          : `"${key}"`;
        fields.push(`${desc}  ${safeKey}${opt}: ${propType};`);
      }
      // For named types, generate separate interface
      if (name && name !== "Root" && fields.length > 3) {
        definitions.set(
          name,
          `${exportKw}interface ${name} {\n${fields.join("\n")}\n}`
        );
        return name;
      }
      return `{\n${fields.join("\n")}\n}`;
    }
    default:
      if (schema.properties) {
        return schemaToTs(
          { ...schema, type: "object" },
          name,
          definitions,
          exportKw
        );
      }
      return "unknown";
  }
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const exportKw = (options?.exportTypes ?? true) ? "export " : "";
  const rootName = options?.rootName ?? "Root";

  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(text) as Record<string, unknown>;
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const definitions = new Map<string, string>();

  // Process $defs / definitions first
  const defs = (schema.$defs ?? schema.definitions) as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (defs) {
    for (const [defName, defSchema] of Object.entries(defs)) {
      const tsName = toPascalCase(defName);
      const tsType = schemaToTs(defSchema, tsName, definitions, exportKw);
      if (!definitions.has(tsName)) {
        if (tsType.startsWith("{")) {
          definitions.set(tsName, `${exportKw}interface ${tsName} ${tsType}`);
        } else {
          definitions.set(tsName, `${exportKw}type ${tsName} = ${tsType};`);
        }
      }
    }
  }

  // Process root schema
  const rootType = schemaToTs(schema, rootName, definitions, exportKw);
  if (!definitions.has(rootName)) {
    if (rootType.startsWith("{")) {
      definitions.set(rootName, `${exportKw}interface ${rootName} ${rootType}`);
    } else {
      definitions.set(rootName, `${exportKw}type ${rootName} = ${rootType};`);
    }
  }

  const lines = ["// Generated from JSON Schema", ""];
  // Output definitions first, then root
  const rootDef = definitions.get(rootName);
  definitions.delete(rootName);
  for (const def of definitions.values()) {
    lines.push(def);
    lines.push("");
  }
  if (rootDef) {
    lines.push(rootDef);
  }

  return { output: lines.join("\n").trimEnd() };
}

export const jsonSchemaToTypescript = defineTool({
  meta: {
    id: "json/json-schema-to-typescript",
    name: "JSON Schema to TypeScript",
    description:
      "Free online JSON Schema to TypeScript converter — generate TypeScript interfaces from JSON Schema definitions instantly in your browser. No data is stored. Handles refs, enums, allOf/oneOf, and nested types.",
    category: "json",
    subgroup: "JSON Schema",
    tier: ToolTier.CLIENT,
    keywords: ["json", "schema", "typescript", "codegen", "types"],
    ui: { inputLanguage: "json", outputLanguage: "typescript" },
    examples: [
      {
        title: "User Schema to TypeScript",
        description:
          "Generate TypeScript interfaces from a JSON Schema with required fields",
        input:
          '{\n  "type": "object",\n  "properties": {\n    "id": {"type": "integer"},\n    "name": {"type": "string"},\n    "email": {"type": "string"},\n    "roles": {"type": "array", "items": {"type": "string"}}\n  },\n  "required": ["id", "name", "email"]\n}',
        output:
          "// Generated from JSON Schema\n\nexport interface Root {\n  id: number;\n  name: string;\n  email: string;\n  roles?: string[];\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
