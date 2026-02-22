import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI specification JSON or YAML-like JSON"),
});

const optionsSchema = z.object({
  exportTypes: z.boolean().default(true).describe("Export all types"),
  generateClient: z
    .boolean()
    .default(false)
    .describe("Generate client function signatures"),
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

function resolveRef(ref: string): string {
  const parts = ref.split("/");
  return toPascalCase(parts[parts.length - 1] ?? "Unknown");
}

function schemaToTs(schema: Record<string, unknown>): string {
  if (schema.$ref) return resolveRef(schema.$ref as string);
  if (schema.enum)
    return (schema.enum as unknown[])
      .map((v) => (typeof v === "string" ? `"${v}"` : String(v)))
      .join(" | ");
  if (schema.oneOf)
    return (schema.oneOf as Record<string, unknown>[])
      .map(schemaToTs)
      .join(" | ");
  if (schema.anyOf)
    return (schema.anyOf as Record<string, unknown>[])
      .map(schemaToTs)
      .join(" | ");
  if (schema.allOf)
    return (schema.allOf as Record<string, unknown>[])
      .map(schemaToTs)
      .join(" & ");

  switch (schema.type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      return items ? `${schemaToTs(items)}[]` : "unknown[]";
    }
    case "object": {
      const props = schema.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!props) return "Record<string, unknown>";
      const required = new Set((schema.required as string[]) ?? []);
      const fields = Object.entries(props).map(([k, v]) => {
        const opt = required.has(k) ? "" : "?";
        return `  ${k}${opt}: ${schemaToTs(v)};`;
      });
      return `{\n${fields.join("\n")}\n}`;
    }
    default:
      if (schema.properties) return schemaToTs({ ...schema, type: "object" });
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
  const generateClient = options?.generateClient ?? false;

  let spec: Record<string, unknown>;
  try {
    spec = JSON.parse(text) as Record<string, unknown>;
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const lines: string[] = ["// Generated from OpenAPI specification", ""];

  // Process schemas from components
  const components = spec.components as Record<string, unknown> | undefined;
  const schemas = (components?.schemas ?? spec.definitions) as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (schemas) {
    for (const [name, schema] of Object.entries(schemas)) {
      const tsName = toPascalCase(name);
      const tsType = schemaToTs(schema);
      if (tsType.startsWith("{")) {
        lines.push(`${exportKw}interface ${tsName} ${tsType}`);
      } else {
        lines.push(`${exportKw}type ${tsName} = ${tsType};`);
      }
      lines.push("");
    }
  }

  // Process paths for client generation
  const paths = spec.paths as
    | Record<string, Record<string, Record<string, unknown>>>
    | undefined;
  if (paths && generateClient) {
    lines.push("// API Client Types");
    lines.push("");

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (typeof operation !== "object" || operation === null) continue;

        const opId = operation.operationId as string | undefined;
        const funcName = opId
          ? opId.replace(/[^a-zA-Z0-9]/g, "_")
          : `${method}${path.replace(/[^a-zA-Z0-9]/g, "_")}`;

        // Parameters
        const params = operation.parameters as
          | Array<Record<string, unknown>>
          | undefined;
        const paramFields: string[] = [];
        if (params) {
          for (const param of params) {
            const pName = param.name as string;
            const pRequired = param.required as boolean;
            const pSchema = param.schema as Record<string, unknown> | undefined;
            const pType = pSchema ? schemaToTs(pSchema) : "string";
            paramFields.push(`  ${pName}${pRequired ? "" : "?"}: ${pType};`);
          }
        }

        // Request body
        const requestBody = operation.requestBody as
          | Record<string, unknown>
          | undefined;
        let bodyType = "void";
        if (requestBody) {
          const content = requestBody.content as
            | Record<string, Record<string, unknown>>
            | undefined;
          const jsonContent = content?.["application/json"];
          if (jsonContent?.schema) {
            bodyType = schemaToTs(
              jsonContent.schema as Record<string, unknown>
            );
          }
        }

        // Response
        const responses = operation.responses as
          | Record<string, Record<string, unknown>>
          | undefined;
        let responseType = "void";
        if (responses) {
          const successResp =
            responses["200"] ?? responses["201"] ?? responses["default"];
          if (successResp) {
            const content = successResp.content as
              | Record<string, Record<string, unknown>>
              | undefined;
            const jsonContent = content?.["application/json"];
            if (jsonContent?.schema) {
              responseType = schemaToTs(
                jsonContent.schema as Record<string, unknown>
              );
            }
          }
        }

        const desc = operation.summary ?? operation.description ?? "";
        if (desc)
          lines.push(
            `/** ${typeof desc === "string" ? desc : JSON.stringify(desc)} - ${method.toUpperCase()} ${path} */`
          );

        if (paramFields.length > 0 && bodyType !== "void") {
          lines.push(
            `${exportKw}type ${toPascalCase(funcName)}Params = {\n${paramFields.join("\n")}\n};`
          );
          lines.push(
            `${exportKw}declare function ${funcName}(params: ${toPascalCase(funcName)}Params, body: ${bodyType}): Promise<${responseType}>;`
          );
        } else if (paramFields.length > 0) {
          lines.push(
            `${exportKw}type ${toPascalCase(funcName)}Params = {\n${paramFields.join("\n")}\n};`
          );
          lines.push(
            `${exportKw}declare function ${funcName}(params: ${toPascalCase(funcName)}Params): Promise<${responseType}>;`
          );
        } else if (bodyType !== "void") {
          lines.push(
            `${exportKw}declare function ${funcName}(body: ${bodyType}): Promise<${responseType}>;`
          );
        } else {
          lines.push(
            `${exportKw}declare function ${funcName}(): Promise<${responseType}>;`
          );
        }
        lines.push("");
      }
    }
  }

  if (lines.length <= 2)
    throw new Error("No schemas or paths found in the OpenAPI specification");

  return { output: lines.join("\n").trimEnd() };
}

export const openapiToTypescript = defineTool({
  meta: {
    id: "api/openapi-to-typescript",
    name: "OpenAPI to TypeScript",
    description:
      "Free online OpenAPI to TypeScript converter — generate TypeScript interfaces and optional client function signatures from OpenAPI specs instantly in your browser. No data is stored. Maps schemas, handles required fields, and supports $ref resolution.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "swagger",
      "typescript",
      "codegen",
      "api",
      "interface",
      "types",
      "client",
    ],
    ui: { inputLanguage: "json", outputLanguage: "typescript" },
    examples: [
      {
        title: "Generate User Interface",
        description:
          "Create TypeScript interfaces from OpenAPI component schemas",
        input:
          '{"openapi":"3.0.3","info":{"title":"API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","required":["id","name"],"properties":{"id":{"type":"integer"},"name":{"type":"string"},"email":{"type":"string"}}}}}}',
        output:
          "// Generated from OpenAPI specification\n\nexport interface User {\n  id: number;\n  name: string;\n  email?: string;\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
