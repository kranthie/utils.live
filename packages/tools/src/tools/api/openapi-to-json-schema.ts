import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI spec in JSON format"),
});

const optionsSchema = z.object({
  schemaName: z
    .string()
    .optional()
    .describe("Specific schema to extract (default: all)"),
});

const outputSchema = z.object({
  output: z.string().describe("Extracted JSON Schema(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function convertToJsonSchema(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(schema)) {
    if (key === "nullable" && val === true) {
      continue; // Handled separately
    }
    if (key === "$ref" && typeof val === "string") {
      result.$ref = val.replace("#/components/schemas/", "#/definitions/");
      continue;
    }
    if (
      key === "example" ||
      key === "xml" ||
      key === "externalDocs" ||
      key === "discriminator"
    ) {
      continue; // OpenAPI-specific, skip
    }
    result[key] = val;
  }

  // Handle nullable
  if (
    schema.nullable === true &&
    result.type &&
    typeof result.type === "string"
  ) {
    result.type = [result.type, "null"];
  }

  // Recurse properties
  if (result.properties && typeof result.properties === "object") {
    const converted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(
      result.properties as Record<string, unknown>
    )) {
      if (typeof val === "object" && val !== null) {
        converted[key] = convertToJsonSchema(val as Record<string, unknown>);
      } else {
        converted[key] = val;
      }
    }
    result.properties = converted;
  }

  if (result.items && typeof result.items === "object") {
    result.items = convertToJsonSchema(result.items as Record<string, unknown>);
  }

  if (result.allOf && Array.isArray(result.allOf)) {
    result.allOf = (result.allOf as unknown[]).map((s: unknown): unknown =>
      typeof s === "object" && s !== null
        ? convertToJsonSchema(s as Record<string, unknown>)
        : s
    );
  }
  if (result.anyOf && Array.isArray(result.anyOf)) {
    result.anyOf = (result.anyOf as unknown[]).map((s: unknown): unknown =>
      typeof s === "object" && s !== null
        ? convertToJsonSchema(s as Record<string, unknown>)
        : s
    );
  }
  if (result.oneOf && Array.isArray(result.oneOf)) {
    result.oneOf = (result.oneOf as unknown[]).map((s: unknown): unknown =>
      typeof s === "object" && s !== null
        ? convertToJsonSchema(s as Record<string, unknown>)
        : s
    );
  }

  return result;
}

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let spec: Record<string, unknown>;
  try {
    spec = JSON.parse(input.input) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON input");
  }

  // Look for schemas in components.schemas (OpenAPI 3.x) or definitions (Swagger 2.0)
  let schemas: Record<string, unknown> = {};

  const components = spec.components as Record<string, unknown> | undefined;
  if (components?.schemas && typeof components.schemas === "object") {
    schemas = components.schemas as Record<string, unknown>;
  } else if (spec.definitions && typeof spec.definitions === "object") {
    schemas = spec.definitions as Record<string, unknown>;
  }

  if (Object.keys(schemas).length === 0) {
    throw new Error("No schemas found in the OpenAPI spec");
  }

  const targetName = options?.schemaName;

  if (targetName) {
    const schema = schemas[targetName];
    if (!schema) {
      throw new Error(
        `Schema '${targetName}' not found. Available: ${Object.keys(schemas).join(", ")}`
      );
    }

    const jsonSchema: Record<string, unknown> = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: targetName,
      ...convertToJsonSchema(schema as Record<string, unknown>),
    };

    return { output: JSON.stringify(jsonSchema, null, 2) };
  }

  // Extract all schemas
  const result: Record<string, unknown> = {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: {},
  };

  for (const [name, schema] of Object.entries(schemas)) {
    if (typeof schema === "object" && schema !== null) {
      (result.definitions as Record<string, unknown>)[name] =
        convertToJsonSchema(schema as Record<string, unknown>);
    }
  }

  return { output: JSON.stringify(result, null, 2) };
}

export const openapiToJsonSchema = defineTool({
  meta: {
    id: "api/openapi-to-json-schema",
    name: "OpenAPI to JSON Schema",
    description:
      "Free online OpenAPI to JSON Schema converter — extract and convert component schemas from OpenAPI specs to standard JSON Schema (draft-07) instantly in your browser. No data is stored. Handles $ref, nullable, and nested structures.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "json",
      "schema",
      "extract",
      "convert",
      "draft-07",
      "component",
      "definition",
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Extract User Schema",
        description:
          "Convert OpenAPI component schemas to standard JSON Schema definitions",
        input:
          '{"openapi":"3.0.3","components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"},"email":{"type":"string","format":"email"}},"required":["id","name"]}}}}',
        output:
          '{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "definitions": {\n    "User": {\n      "type": "object",\n      "properties": {\n        "id": {\n          "type": "integer"\n        },\n        "name": {\n          "type": "string"\n        },\n        "email": {\n          "type": "string",\n          "format": "email"\n        }\n      },\n      "required": [\n        "id",\n        "name"\n      ]\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
