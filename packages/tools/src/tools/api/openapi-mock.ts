import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI spec in JSON format"),
});

const optionsSchema = z.object({
  path: z
    .string()
    .optional()
    .describe("Specific path to generate mock for (default: all)"),
  method: z.string().default("get").describe("HTTP method"),
  statusCode: z.string().default("200").describe("Response status code"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated mock responses as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function generateMockFromSchema(schema: Record<string, unknown>): unknown {
  const type = schema.type as string | undefined;
  const example = schema.example;
  if (example !== undefined) return example;

  const enumValues = schema.enum as unknown[] | undefined;
  if (enumValues && enumValues.length > 0) return enumValues[0];

  switch (type) {
    case "string": {
      const format = schema.format as string | undefined;
      if (format === "date") return "2024-01-15";
      if (format === "date-time") return "2024-01-15T10:30:00Z";
      if (format === "email") return "user@example.com";
      if (format === "uri" || format === "url") return "https://example.com";
      if (format === "uuid") return "550e8400-e29b-41d4-a716-446655440000";
      if (format === "ipv4") return "192.168.1.1";
      if (format === "ipv6") return "::1";
      return "string";
    }
    case "integer":
    case "number": {
      const min = schema.minimum as number | undefined;
      const max = schema.maximum as number | undefined;
      if (min !== undefined) return min;
      if (max !== undefined) return Math.min(0, max);
      return type === "integer" ? 0 : 0.0;
    }
    case "boolean":
      return true;
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      if (items) {
        return [generateMockFromSchema(items)];
      }
      return [];
    }
    case "object":
    default: {
      const properties = schema.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!properties) return {};
      const result: Record<string, unknown> = {};
      for (const [key, propSchema] of Object.entries(properties)) {
        result[key] = generateMockFromSchema(propSchema);
      }
      return result;
    }
  }
}

function resolveRef(
  spec: Record<string, unknown>,
  ref: string
): Record<string, unknown> {
  const parts = ref.replace("#/", "").split("/");
  let current: unknown = spec;
  for (const part of parts) {
    if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[part];
    }
  }
  return (current as Record<string, unknown>) ?? {};
}

function resolveSchema(
  spec: Record<string, unknown>,
  schema: Record<string, unknown>
): Record<string, unknown> {
  if (schema.$ref) {
    return resolveRef(spec, schema.$ref as string);
  }
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const merged: Record<string, unknown> = { type: "object", properties: {} };
    for (const item of schema.allOf) {
      const resolved = resolveSchema(spec, item as Record<string, unknown>);
      if (resolved.properties) {
        Object.assign(
          merged.properties as Record<string, unknown>,
          resolved.properties
        );
      }
    }
    return merged;
  }
  return schema;
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

  const paths = spec.paths as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!paths) {
    throw new Error("No paths found in OpenAPI spec");
  }

  const targetPath = options?.path;
  const targetMethod = (options?.method ?? "get").toLowerCase();
  const targetStatus = options?.statusCode ?? "200";
  const mocks: Record<string, unknown> = {};

  for (const [pathKey, methods] of Object.entries(paths)) {
    if (targetPath && pathKey !== targetPath) continue;

    for (const [method, operation] of Object.entries(methods)) {
      if (method.startsWith("x-") || method === "parameters") continue;
      if (targetPath && method.toLowerCase() !== targetMethod) continue;

      const op = operation as Record<string, unknown>;
      const responses = op.responses as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!responses) continue;

      for (const [statusCode, response] of Object.entries(responses)) {
        if (targetPath && statusCode !== targetStatus) continue;

        const content = response.content as
          | Record<string, Record<string, unknown>>
          | undefined;
        if (content) {
          const jsonContent = content["application/json"];
          if (jsonContent?.schema) {
            const schema = resolveSchema(
              spec,
              jsonContent.schema as Record<string, unknown>
            );
            const mock = generateMockFromSchema(schema);
            const key = `${method.toUpperCase()} ${pathKey} [${statusCode}]`;
            mocks[key] = mock;
          }
        } else if (response.schema) {
          const schema = resolveSchema(
            spec,
            response.schema as Record<string, unknown>
          );
          const mock = generateMockFromSchema(schema);
          const key = `${method.toUpperCase()} ${pathKey} [${statusCode}]`;
          mocks[key] = mock;
        }
      }
    }
  }

  if (Object.keys(mocks).length === 0) {
    return {
      output:
        "No mock responses could be generated. Ensure paths have response schemas defined.",
    };
  }

  return { output: JSON.stringify(mocks, null, 2) };
}

export const openapiMock = defineTool({
  meta: {
    id: "api/openapi-mock",
    name: "OpenAPI Mock Generator",
    description:
      "Free online OpenAPI mock response generator — create realistic mock JSON responses from OpenAPI specification paths and schemas instantly in your browser. No data is stored. Resolves $ref references, supports all data types and formats.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "mock",
      "fake",
      "test",
      "response",
      "api",
      "sample",
      "fixture",
    ],
    examples: [
      {
        title: "Mock User Endpoint Response",
        description:
          "Generate mock response data from an OpenAPI spec with a /users GET endpoint",
        input:
          '{"openapi":"3.0.3","info":{"title":"API","version":"1.0.0"},"paths":{"/users":{"get":{"summary":"List users","responses":{"200":{"description":"OK","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"},"email":{"type":"string","format":"email"}}}}}}}}}}}}',
        output:
          '{\n  "GET /users [200]": [\n    {\n      "id": 0,\n      "name": "string",\n      "email": "user@example.com"\n    }\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
