import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI spec in JSON format"),
});

const outputSchema = z.object({
  output: z.string().describe("OpenAPI spec in YAML format"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function toYaml(obj: unknown, indent: number = 0): string {
  const prefix = "  ".repeat(indent);

  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") {
    if (
      obj.includes("\n") ||
      obj.includes(":") ||
      obj.includes("#") ||
      obj.includes("{") ||
      obj.includes("}") ||
      obj.includes("[") ||
      obj.includes("]") ||
      obj.includes(",") ||
      obj.includes("&") ||
      obj.includes("*") ||
      obj.includes("!") ||
      obj.includes("|") ||
      obj.includes(">") ||
      obj.includes("'") ||
      obj.includes('"') ||
      obj.startsWith(" ") ||
      obj.endsWith(" ") ||
      obj === "true" ||
      obj === "false" ||
      obj === "null" ||
      obj === "" ||
      !isNaN(Number(obj))
    ) {
      return `"${obj.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const lines: string[] = [];
    for (const item of obj) {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const entries = Object.entries(item as Record<string, unknown>);
        if (entries.length > 0) {
          const [firstKey, firstVal] = entries[0]!;
          lines.push(`${prefix}- ${firstKey}: ${toYaml(firstVal, indent + 2)}`);
          for (let i = 1; i < entries.length; i++) {
            const [key, val] = entries[i]!;
            if (typeof val === "object" && val !== null) {
              lines.push(`${prefix}  ${key}:`);
              lines.push(
                toYaml(val, indent + 2)
                  .split("\n")
                  .map((l) => `${prefix}  ${l.trimStart()}`)
                  .join("\n")
              );
            } else {
              lines.push(`${prefix}  ${key}: ${toYaml(val, indent + 2)}`);
            }
          }
        } else {
          lines.push(`${prefix}- {}`);
        }
      } else {
        lines.push(`${prefix}- ${toYaml(item, indent + 1)}`);
      }
    }
    return lines.join("\n");
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const lines: string[] = [];
    for (const [key, val] of entries) {
      if (typeof val === "object" && val !== null) {
        const nested = toYaml(val, indent + 1);
        if (nested === "{}" || nested === "[]") {
          // Empty collections can be inlined
          lines.push(`${prefix}${key}: ${nested}`);
        } else {
          // Non-empty objects/arrays always go on a new line (block style)
          lines.push(`${prefix}${key}:`);
          lines.push(nested);
        }
      } else {
        lines.push(`${prefix}${key}: ${toYaml(val, indent + 1)}`);
      }
    }
    return lines.join("\n");
  }

  return JSON.stringify(obj);
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let spec: unknown;
  try {
    spec = JSON.parse(input.input);
  } catch {
    throw new Error("Invalid JSON input");
  }

  const yaml = toYaml(spec);
  return { output: yaml };
}

export const jsonToOpenapi = defineTool({
  meta: {
    id: "api/json-to-openapi",
    name: "JSON to OpenAPI YAML",
    description:
      "Free online OpenAPI JSON to YAML converter — transform OpenAPI specifications from JSON to YAML format instantly in your browser. No data is stored. Preserves paths, schemas, responses, and all OpenAPI 3.x structures.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "json",
      "yaml",
      "convert",
      "swagger",
      "spec",
      "api",
      "transform",
    ],
    ui: { inputLanguage: "json", outputLanguage: "yaml" },
    examples: [
      {
        title: "Convert Users API Spec to YAML",
        description: "Transform an OpenAPI 3.0 JSON spec into YAML format",
        input:
          '{"openapi":"3.0.3","info":{"title":"Users API","version":"1.0.0"},"paths":{"/users":{"get":{"summary":"List users","responses":{"200":{"description":"OK"}}}}}}',
        output:
          'openapi: 3.0.3\ninfo:\n  title: Users API\n  version: 1.0.0\npaths:\n  /users:\n    get:\n      summary: List users\n      responses:\n        "200":\n          description: OK',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
