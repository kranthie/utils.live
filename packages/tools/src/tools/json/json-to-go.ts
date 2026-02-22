import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON data to generate Go structs from"),
});

const optionsSchema = z.object({
  rootName: z.string().default("Root").describe("Name of the root struct"),
  jsonTags: z.boolean().default(true).describe("Include json struct tags"),
  omitempty: z.boolean().default(false).describe("Add omitempty to json tags"),
  inlineStructs: z.boolean().default(false).describe("Inline nested structs"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Go structs"),
});

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toGoName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .split(/[_\s-]+/)
    .map(capitalize)
    .join("")
    .replace(/^(\d)/, "_$1");
}

function inferGoType(
  value: unknown,
  name: string,
  structs: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): string {
  if (value === null) return "interface{}";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return Number.isInteger(value) ? "int" : "float64";
    case "boolean":
      return "bool";
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return "[]interface{}";
        const first: unknown = value[0];
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
          if (opts.inlineStructs) {
            return "[]" + generateInlineStruct(merged, opts);
          }
          const structName = toGoName(name);
          generateStruct(merged, structName, structs, opts);
          return "[]" + structName;
        }
        return "[]" + inferGoType(first, name, structs, opts);
      }
      if (opts.inlineStructs) {
        return generateInlineStruct(value as Record<string, unknown>, opts);
      }
      const structName = toGoName(name);
      generateStruct(
        value as Record<string, unknown>,
        structName,
        structs,
        opts
      );
      return structName;
    }
    default:
      return "interface{}";
  }
}

function generateInlineStruct(
  obj: Record<string, unknown>,
  opts: z.infer<typeof optionsSchema>
): string {
  const fields: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const goName = toGoName(key);
    const goType =
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? generateInlineStruct(value as Record<string, unknown>, opts)
        : inferGoType(value, key, new Map(), opts);
    const tag = opts.jsonTags
      ? ` \`json:"${key}${opts.omitempty ? ",omitempty" : ""}"\``
      : "";
    fields.push(`\t${goName} ${goType}${tag}`);
  }
  return `struct {\n${fields.join("\n")}\n}`;
}

function generateStruct(
  obj: Record<string, unknown>,
  name: string,
  structs: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): void {
  if (structs.has(name)) return;
  structs.set(name, ""); // prevent recursion

  const fields: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const goName = toGoName(key);
    const goType = inferGoType(value, key, structs, opts);
    const tag = opts.jsonTags
      ? ` \`json:"${key}${opts.omitempty ? ",omitempty" : ""}"\``
      : "";
    fields.push(`\t${goName} ${goType}${tag}`);
  }

  structs.set(name, `type ${name} struct {\n${fields.join("\n")}\n}`);
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const opts = {
    rootName: options?.rootName ?? "Root",
    jsonTags: options?.jsonTags ?? true,
    omitempty: options?.omitempty ?? false,
    inlineStructs: options?.inlineStructs ?? false,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const structs = new Map<string, string>();

  if (Array.isArray(parsed)) {
    if (
      parsed.length > 0 &&
      typeof parsed[0] === "object" &&
      parsed[0] !== null
    ) {
      const merged: Record<string, unknown> = {};
      for (const item of parsed) {
        if (item && typeof item === "object") {
          for (const [k, v] of Object.entries(
            item as Record<string, unknown>
          )) {
            if (!(k in merged)) merged[k] = v;
          }
        }
      }
      generateStruct(merged, opts.rootName, structs, opts);
    }
  } else if (typeof parsed === "object" && parsed !== null) {
    generateStruct(
      parsed as Record<string, unknown>,
      opts.rootName,
      structs,
      opts
    );
  } else {
    return {
      output: `// JSON primitive: ${typeof parsed}\ntype ${opts.rootName} = ${typeof parsed === "string" ? "string" : typeof parsed === "number" ? "float64" : "bool"}`,
    };
  }

  const entries = [...structs.values()].reverse();
  return { output: entries.join("\n\n") };
}

export const jsonToGo = defineTool({
  meta: {
    id: "json/json-to-go",
    name: "JSON to Go",
    description:
      "Free online JSON to Go converter — generate Go structs with JSON tags from sample data instantly in your browser. No data is stored. Supports omitempty, inline structs, and nested type inference.",
    category: "json",
    subgroup: "Code Generation",
    tier: ToolTier.CLIENT,
    keywords: ["json", "go", "golang", "struct", "codegen"],
    ui: { inputLanguage: "json", outputLanguage: "go" },
    examples: [
      {
        title: "User Object",
        description: "Generate a Go struct with JSON tags from a user object",
        input:
          '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "active": true\n}',
        output:
          'type Root struct {\n\tId int `json:"id"`\n\tName string `json:"name"`\n\tEmail string `json:"email"`\n\tActive bool `json:"active"`\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
