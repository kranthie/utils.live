import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON data to generate JSON Schema from"),
});

const optionsSchema = z.object({
  draft: z
    .enum(["draft-04", "draft-07", "2020-12"])
    .default("draft-07")
    .describe("JSON Schema draft version"),
  required: z
    .boolean()
    .default(true)
    .describe("Mark all properties as required"),
  title: z.string().default("").describe("Schema title"),
  description: z.string().default("").describe("Schema description"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated JSON Schema"),
});

function inferSchema(value: unknown): Record<string, unknown> {
  if (value === null) return { type: "null" };
  switch (typeof value) {
    case "string": {
      const schema: Record<string, unknown> = { type: "string" };
      if (/^\d{4}-\d{2}-\d{2}T/.test(value)) schema.format = "date-time";
      else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) schema.format = "date";
      else if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value))
        schema.format = "email";
      else if (/^https?:\/\//.test(value)) schema.format = "uri";
      else if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value
        )
      )
        schema.format = "uuid";
      else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value))
        schema.format = "ipv4";
      return schema;
    }
    case "number":
      return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return { type: "array", items: {} };
        // If all items are same type, use single items schema
        const itemSchemas = value.map(inferSchema);
        const types = new Set(itemSchemas.map((s) => JSON.stringify(s)));
        if (types.size === 1) {
          return { type: "array", items: itemSchemas[0] };
        }
        // Merge object schemas
        if (
          value.every(
            (v) => typeof v === "object" && v !== null && !Array.isArray(v)
          )
        ) {
          const merged: Record<string, unknown> = {};
          for (const item of value) {
            for (const [k, v] of Object.entries(
              item as Record<string, unknown>
            )) {
              if (!(k in merged)) merged[k] = v;
            }
          }
          return { type: "array", items: inferSchema(merged) };
        }
        return { type: "array", items: { oneOf: itemSchemas } };
      }
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, val] of Object.entries(
        value as Record<string, unknown>
      )) {
        properties[key] = inferSchema(val);
        if (val !== null && val !== undefined) required.push(key);
      }
      const schema: Record<string, unknown> = { type: "object", properties };
      if (required.length > 0) schema.required = required;
      return schema;
    }
    default:
      return {};
  }
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const draft = options?.draft ?? "draft-07";
  const addRequired = options?.required ?? true;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const schema = inferSchema(parsed);

  // Add schema metadata
  const draftUrls: Record<string, string> = {
    "draft-04": "http://json-schema.org/draft-04/schema#",
    "draft-07": "http://json-schema.org/draft-07/schema#",
    "2020-12": "https://json-schema.org/draft/2020-12/schema",
  };

  const result: Record<string, unknown> = {
    $schema: draftUrls[draft],
    ...schema,
  };

  if (options?.title) result.title = options.title;
  if (options?.description) result.description = options.description;

  if (!addRequired && result.required) {
    delete result.required;
    // Also remove from nested
    const removeRequired = (obj: unknown): void => {
      if (typeof obj !== "object" || obj === null) return;
      if ("required" in (obj as Record<string, unknown>))
        delete (obj as Record<string, unknown>).required;
      if ("properties" in (obj as Record<string, unknown>)) {
        for (const prop of Object.values(
          (obj as Record<string, unknown>).properties as Record<string, unknown>
        )) {
          removeRequired(prop);
        }
      }
      if ("items" in (obj as Record<string, unknown>)) {
        removeRequired((obj as Record<string, unknown>).items);
      }
    };
    removeRequired(result);
  }

  return { output: JSON.stringify(result, null, 2) };
}

export const jsonSchemaGenerator = defineTool({
  meta: {
    id: "json/json-schema-generator",
    name: "JSON Schema Generator",
    description:
      "Free online JSON Schema generator — infer a JSON Schema from sample data with format detection instantly in your browser. No data is stored. Detects email, URI, UUID, date-time, and IP formats.",
    category: "json",
    subgroup: "JSON Schema",
    tier: ToolTier.CLIENT,
    keywords: ["json", "schema", "generate", "validate", "draft"],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Generate from Object",
        description:
          "Infer a JSON Schema from a sample user object with format detection",
        input:
          '{\n  "name": "Alice",\n  "email": "alice@example.com",\n  "age": 30,\n  "active": true\n}',
        output:
          '{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string"\n    },\n    "email": {\n      "type": "string",\n      "format": "email"\n    },\n    "age": {\n      "type": "integer"\n    },\n    "active": {\n      "type": "boolean"\n    }\n  },\n  "required": [\n    "name",\n    "email",\n    "age",\n    "active"\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
