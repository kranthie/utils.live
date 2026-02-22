import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON Schema document"),
});

const optionsSchema = z.object({
  schemaName: z
    .string()
    .default("MySchema")
    .describe("Name for the component schema"),
});

const outputSchema = z.object({
  output: z.string().describe("OpenAPI component schema in JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function convertToOpenApiSchema(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Copy standard properties
  const copyProps = [
    "type",
    "properties",
    "items",
    "required",
    "enum",
    "format",
    "description",
    "title",
    "default",
    "example",
    "minimum",
    "maximum",
    "minLength",
    "maxLength",
    "pattern",
    "minItems",
    "maxItems",
    "uniqueItems",
    "additionalProperties",
    "allOf",
    "anyOf",
    "oneOf",
    "not",
  ];

  for (const prop of copyProps) {
    if (schema[prop] !== undefined) {
      result[prop] = schema[prop];
    }
  }

  // Remove JSON Schema-specific properties not in OpenAPI
  // $schema, $id, definitions -> keep as x-extensions or convert

  if (schema.$ref && typeof schema.$ref === "string") {
    result.$ref = schema.$ref.replace(
      "#/definitions/",
      "#/components/schemas/"
    );
  }

  // Recursively convert properties
  if (result.properties && typeof result.properties === "object") {
    const converted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(
      result.properties as Record<string, unknown>
    )) {
      if (typeof val === "object" && val !== null) {
        converted[key] = convertToOpenApiSchema(val as Record<string, unknown>);
      } else {
        converted[key] = val;
      }
    }
    result.properties = converted;
  }

  if (result.items && typeof result.items === "object") {
    result.items = convertToOpenApiSchema(
      result.items as Record<string, unknown>
    );
  }

  if (result.allOf && Array.isArray(result.allOf)) {
    result.allOf = (result.allOf as unknown[]).map((s: unknown): unknown =>
      typeof s === "object" && s !== null
        ? convertToOpenApiSchema(s as Record<string, unknown>)
        : s
    );
  }
  if (result.anyOf && Array.isArray(result.anyOf)) {
    result.anyOf = (result.anyOf as unknown[]).map((s: unknown): unknown =>
      typeof s === "object" && s !== null
        ? convertToOpenApiSchema(s as Record<string, unknown>)
        : s
    );
  }
  if (result.oneOf && Array.isArray(result.oneOf)) {
    result.oneOf = (result.oneOf as unknown[]).map((s: unknown): unknown =>
      typeof s === "object" && s !== null
        ? convertToOpenApiSchema(s as Record<string, unknown>)
        : s
    );
  }

  // Add nullable support for OpenAPI 3.0
  if (Array.isArray(schema.type) && schema.type.includes("null")) {
    const nonNullTypes = (schema.type as string[]).filter((t) => t !== "null");
    if (nonNullTypes.length === 1) {
      result.type = nonNullTypes[0];
      result.nullable = true;
    }
  }

  return result;
}

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(input.input) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON input");
  }

  const schemaName = options?.schemaName ?? "MySchema";
  const converted = convertToOpenApiSchema(schema);

  // Also convert definitions to components
  const components: Record<string, unknown> = {};
  components[schemaName] = converted;

  if (schema.definitions && typeof schema.definitions === "object") {
    for (const [name, def] of Object.entries(
      schema.definitions as Record<string, unknown>
    )) {
      if (typeof def === "object" && def !== null) {
        components[name] = convertToOpenApiSchema(
          def as Record<string, unknown>
        );
      }
    }
  }

  const openapi = {
    components: {
      schemas: components,
    },
  };

  return { output: JSON.stringify(openapi, null, 2) };
}

export const jsonSchemaToOpenapi = defineTool({
  meta: {
    id: "api/json-schema-to-openapi",
    name: "JSON Schema to OpenAPI",
    description:
      "Free online JSON Schema to OpenAPI converter — wrap JSON Schema definitions as OpenAPI 3.0 component schemas instantly in your browser. No data is stored. Preserves types, required fields, formats, and nested object structures.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "json",
      "schema",
      "openapi",
      "convert",
      "component",
      "swagger",
      "api",
      "spec",
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "User Schema to OpenAPI Component",
        description:
          "Convert a JSON Schema user definition to an OpenAPI component schema",
        input:
          '{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"},"email":{"type":"string","format":"email"}},"required":["id","name"]}',
        output:
          '{\n  "components": {\n    "schemas": {\n      "MySchema": {\n        "type": "object",\n        "properties": {\n          "id": {\n            "type": "integer"\n          },\n          "name": {\n            "type": "string"\n          },\n          "email": {\n            "type": "string",\n            "format": "email"\n          }\n        },\n        "required": [\n          "id",\n          "name"\n        ]\n      }\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
