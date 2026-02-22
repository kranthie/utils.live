import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI spec in YAML format"),
});

const outputSchema = z.object({
  output: z.string().describe("OpenAPI spec in JSON format"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function parseSimpleYaml(yaml: string): unknown {
  const lines = yaml.split("\n");
  const root: Record<string, unknown> = {};
  const stack: Array<{
    obj: Record<string, unknown> | unknown[];
    indent: number;
    key?: string;
  }> = [{ obj: root, indent: -2 }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.search(/\S/);
    const content = line.trim();

    // Handle array items
    if (content.startsWith("- ")) {
      while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1]!.obj;
      const parentKey = stack[stack.length - 1]!.key;
      let arr: unknown[];

      if (
        parentKey &&
        typeof parent === "object" &&
        parent !== null &&
        !Array.isArray(parent)
      ) {
        const existing = parent[parentKey];
        if (Array.isArray(existing)) {
          arr = existing;
        } else {
          arr = [];
          parent[parentKey] = arr;
        }
      } else if (Array.isArray(parent)) {
        arr = parent;
      } else {
        continue;
      }

      const itemContent = content.substring(2).trim();
      if (itemContent.includes(":")) {
        const colonIdx = itemContent.indexOf(":");
        const key = itemContent.substring(0, colonIdx).trim();
        const val = itemContent.substring(colonIdx + 1).trim();
        const obj: Record<string, unknown> = {};
        obj[key] = parseValue(val);
        arr.push(obj);
        stack.push({ obj: obj, indent: indent + 2 });
      } else {
        arr.push(parseValue(itemContent));
      }
      continue;
    }

    const colonIdx = content.indexOf(":");
    if (colonIdx === -1) continue;

    const key = content.substring(0, colonIdx).trim();
    const rawValue = content.substring(colonIdx + 1).trim();

    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1]!.obj as Record<string, unknown>;

    if (rawValue === "" || rawValue === "|" || rawValue === ">") {
      const child: Record<string, unknown> = {};
      current[key] = child;
      stack.push({ obj: child, indent, key });
    } else {
      current[key] = parseValue(rawValue);
    }
  }

  return root;
}

function parseValue(val: string): unknown {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null" || val === "~") return null;
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
  if (val.startsWith("[") && val.endsWith("]")) {
    const inner = val.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((v) => parseValue(v.trim()));
  }
  if (!isNaN(Number(val)) && val !== "") return Number(val);
  return val;
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const trimmed = input.input.trim();

  // If already JSON, just format it
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      return { output: JSON.stringify(parsed, null, 2) };
    } catch {
      // Not valid JSON, try YAML parsing
    }
  }

  const parsed = parseSimpleYaml(trimmed);
  return { output: JSON.stringify(parsed, null, 2) };
}

export const openapiToJson = defineTool({
  meta: {
    id: "api/openapi-to-json",
    name: "OpenAPI YAML to JSON",
    description:
      "Free online OpenAPI YAML to JSON converter — transform OpenAPI specifications from YAML to JSON format instantly in your browser. No data is stored. Parses standard YAML syntax including nested objects, arrays, and quoted strings.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "yaml",
      "json",
      "convert",
      "swagger",
      "spec",
      "transform",
      "parse",
    ],
    ui: { inputLanguage: "yaml", outputLanguage: "json" },
    examples: [
      {
        title: "Convert Pet Store YAML to JSON",
        description: "Transform an OpenAPI YAML spec into JSON format",
        input:
          "openapi: 3.0.3\ninfo:\n  title: Pet Store\n  version: 1.0.0\npaths:\n  /pets:\n    get:\n      summary: List pets",
        output:
          '{\n  "openapi": "3.0.3",\n  "info": {\n    "title": "Pet Store",\n    "version": "1.0.0"\n  },\n  "paths": {\n    "/pets": {\n      "get": {\n        "summary": "List pets"\n      }\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
