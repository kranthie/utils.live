import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON data to generate C# classes from"),
});

const optionsSchema = z.object({
  rootName: z.string().default("Root").describe("Name of the root class"),
  namespace: z.string().default("MyApp.Models").describe("C# namespace"),
  useRecord: z
    .boolean()
    .default(false)
    .describe("Use record types instead of class"),
  useJsonProperty: z
    .boolean()
    .default(true)
    .describe("Add JsonProperty attributes"),
  nullableRef: z
    .boolean()
    .default(true)
    .describe("Use nullable reference types"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated C# classes"),
});

function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]/g, "_")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function inferCSharpType(
  value: unknown,
  name: string,
  classes: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): string {
  if (value === null) return opts.nullableRef ? "object?" : "object";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return Number.isInteger(value)
        ? Math.abs(value) > 2147483647
          ? "long"
          : "int"
        : "double";
    case "boolean":
      return "bool";
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return "List<object>";
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
          const className = toPascalCase(name);
          generateClass(merged, className, classes, opts);
          return `List<${className}>`;
        }
        return `List<${inferCSharpType(first, name, classes, opts)}>`;
      }
      const className = toPascalCase(name);
      generateClass(value as Record<string, unknown>, className, classes, opts);
      return className;
    }
    default:
      return "object";
  }
}

function generateClass(
  obj: Record<string, unknown>,
  name: string,
  classes: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): void {
  if (classes.has(name)) return;
  classes.set(name, "");

  const keyword = opts.useRecord ? "record" : "class";
  const lines: string[] = [];
  lines.push(`    public ${keyword} ${name}`);

  if (opts.useRecord) {
    // Record syntax
    const fields = Object.entries(obj).map(([key, value]) => {
      const csType = inferCSharpType(value, key, classes, opts);
      return `        ${csType} ${toPascalCase(key)}`;
    });
    lines.push("    (");
    lines.push(fields.join(",\n"));
    lines.push("    );");
  } else {
    lines.push("    {");
    for (const [key, value] of Object.entries(obj)) {
      const csType = inferCSharpType(value, key, classes, opts);
      const propName = toPascalCase(key);
      if (opts.useJsonProperty && propName !== key) {
        lines.push(`        [JsonPropertyName("${key}")]`);
      }
      lines.push(`        public ${csType} ${propName} { get; set; }`);
      lines.push("");
    }
    lines.push("    }");
  }

  classes.set(name, lines.join("\n"));
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const opts = {
    rootName: options?.rootName ?? "Root",
    namespace: options?.namespace ?? "MyApp.Models",
    useRecord: options?.useRecord ?? false,
    useJsonProperty: options?.useJsonProperty ?? true,
    nullableRef: options?.nullableRef ?? true,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const classes = new Map<string, string>();

  if (
    Array.isArray(parsed) &&
    parsed.length > 0 &&
    typeof parsed[0] === "object"
  ) {
    const merged: Record<string, unknown> = {};
    for (const item of parsed) {
      if (item && typeof item === "object") {
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          if (!(k in merged)) merged[k] = v;
        }
      }
    }
    generateClass(merged, opts.rootName, classes, opts);
  } else if (
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed)
  ) {
    generateClass(
      parsed as Record<string, unknown>,
      opts.rootName,
      classes,
      opts
    );
  } else {
    return { output: `// JSON primitive type: ${typeof parsed}` };
  }

  const lines: string[] = [];
  lines.push("using System.Collections.Generic;");
  if (opts.useJsonProperty) lines.push("using System.Text.Json.Serialization;");
  lines.push("");
  lines.push(`namespace ${opts.namespace}`);
  lines.push("{");

  const entries = [...classes.values()].reverse();
  lines.push(entries.join("\n\n"));

  lines.push("}");
  return { output: lines.join("\n") };
}

export const jsonToCsharp = defineTool({
  meta: {
    id: "json/json-to-csharp",
    name: "JSON to C#",
    description:
      "Free online JSON to C# converter — generate C# classes or record types from JSON data instantly in your browser. No data is stored. Supports JsonPropertyName attributes and nullable reference types.",
    category: "json",
    subgroup: "Code Generation",
    tier: ToolTier.CLIENT,
    keywords: ["json", "csharp", "class", "dotnet", "codegen"],
    ui: { inputLanguage: "json", outputLanguage: "csharp" },
    examples: [
      {
        title: "User Class",
        description:
          "Generate a C# class with JsonPropertyName attributes from a user object",
        input:
          '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "active": true\n}',
        output:
          'using System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\nnamespace MyApp.Models\n{\n    public class Root\n    {\n        [JsonPropertyName("id")]\n        public int Id { get; set; }\n\n        [JsonPropertyName("name")]\n        public string Name { get; set; }\n\n        [JsonPropertyName("email")]\n        public string Email { get; set; }\n\n        [JsonPropertyName("active")]\n        public bool Active { get; set; }\n\n    }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
