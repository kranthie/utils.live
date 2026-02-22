import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI spec in JSON format"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the spec is valid"),
  version: z.string().optional().describe("Detected OpenAPI/Swagger version"),
  errors: z.array(z.string()).describe("Validation errors"),
  warnings: z.array(z.string()).describe("Validation warnings"),
  stats: z
    .object({
      paths: z.number(),
      operations: z.number(),
      schemas: z.number(),
      parameters: z.number(),
    })
    .describe("Spec statistics"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let spec: Record<string, unknown>;
  try {
    spec = JSON.parse(input.input) as Record<string, unknown>;
  } catch {
    return {
      valid: false,
      errors: ["Invalid JSON: Could not parse the input as JSON"],
      warnings: [],
      stats: { paths: 0, operations: 0, schemas: 0, parameters: 0 },
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  let version: string | undefined;

  // Detect version
  if (spec.openapi) {
    version = String(spec.openapi as string | number);
    if (!version.startsWith("3.")) {
      warnings.push(`Unusual OpenAPI version: ${version}`);
    }
  } else if (spec.swagger) {
    const swaggerVersion = String(spec.swagger as string | number);
    version = `Swagger ${swaggerVersion}`;
    if (swaggerVersion !== "2.0") {
      warnings.push(`Unusual Swagger version: ${swaggerVersion}`);
    }
  } else {
    errors.push("Missing 'openapi' or 'swagger' version field");
  }

  // Validate info
  if (!spec.info) {
    errors.push("Missing required 'info' object");
  } else {
    const info = spec.info as Record<string, unknown>;
    if (!info.title) errors.push("Missing required 'info.title'");
    if (!info.version) errors.push("Missing required 'info.version'");
    if (!info.description)
      warnings.push("Missing recommended 'info.description'");
    if (!info.contact) warnings.push("Missing recommended 'info.contact'");
  }

  // Validate paths
  let pathCount = 0;
  let operationCount = 0;
  const validMethods = [
    "get",
    "post",
    "put",
    "delete",
    "patch",
    "options",
    "head",
    "trace",
  ];

  if (!spec.paths) {
    warnings.push("No paths defined");
  } else {
    const paths = spec.paths as Record<string, unknown>;
    pathCount = Object.keys(paths).length;

    for (const [path, methods] of Object.entries(paths)) {
      if (!path.startsWith("/")) {
        errors.push(`Path '${path}' must start with '/'`);
      }

      if (typeof methods === "object" && methods !== null) {
        for (const [method, operation] of Object.entries(
          methods as Record<string, unknown>
        )) {
          if (method.startsWith("x-")) continue;
          if (
            method === "parameters" ||
            method === "summary" ||
            method === "description"
          )
            continue;

          if (!validMethods.includes(method.toLowerCase())) {
            errors.push(`Invalid HTTP method '${method}' in path '${path}'`);
            continue;
          }

          operationCount++;
          if (typeof operation === "object" && operation !== null) {
            const op = operation as Record<string, unknown>;
            if (!op.responses) {
              errors.push(
                `Missing 'responses' in ${method.toUpperCase()} ${path}`
              );
            }
            if (!op.operationId) {
              warnings.push(
                `Missing 'operationId' in ${method.toUpperCase()} ${path}`
              );
            }
          }
        }
      }
    }
  }

  // Count schemas
  let schemaCount = 0;
  let parameterCount = 0;

  if (spec.components && typeof spec.components === "object") {
    const components = spec.components as Record<string, unknown>;
    if (components.schemas && typeof components.schemas === "object") {
      schemaCount = Object.keys(
        components.schemas as Record<string, unknown>
      ).length;
    }
    if (components.parameters && typeof components.parameters === "object") {
      parameterCount = Object.keys(
        components.parameters as Record<string, unknown>
      ).length;
    }
  } else if (spec.definitions && typeof spec.definitions === "object") {
    schemaCount = Object.keys(
      spec.definitions as Record<string, unknown>
    ).length;
  }

  // Servers validation (OpenAPI 3.x)
  if (version && version.startsWith("3.") && !spec.servers) {
    warnings.push("Missing 'servers' array (recommended for OpenAPI 3.x)");
  }

  return {
    valid: errors.length === 0,
    version,
    errors,
    warnings,
    stats: {
      paths: pathCount,
      operations: operationCount,
      schemas: schemaCount,
      parameters: parameterCount,
    },
  };
}

export const openapiValidator = defineTool({
  meta: {
    id: "api/openapi-validator",
    name: "OpenAPI Validator",
    description:
      "Free online OpenAPI validator — check OpenAPI and Swagger specifications for structural errors, missing fields, and best-practice warnings instantly in your browser. No data is stored. Reports path count, operation count, and schema statistics.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "swagger",
      "validate",
      "check",
      "lint",
      "api",
      "errors",
      "spec",
    ],
    examples: [
      {
        title: "Validate Pet Store Spec",
        description: "Check an OpenAPI 3.0 spec for errors and warnings",
        input:
          '{"openapi":"3.0.3","info":{"title":"Pet Store","version":"1.0.0"},"paths":{"/pets":{"get":{"summary":"List pets","responses":{"200":{"description":"OK"}}}}}}',
        output:
          '{\n  "valid": true,\n  "version": "3.0.3",\n  "errors": [],\n  "warnings": [\n    "Missing recommended \'info.description\'",\n    "Missing recommended \'info.contact\'",\n    "Missing \'operationId\' in GET /pets",\n    "Missing \'servers\' array (recommended for OpenAPI 3.x)"\n  ],\n  "stats": {\n    "paths": 1,\n    "operations": 1,\n    "schemas": 0,\n    "parameters": 0\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
