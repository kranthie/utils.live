import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON data to generate Python classes from"),
});

const optionsSchema = z.object({
  rootName: z.string().default("Root").describe("Name of the root class"),
  style: z
    .enum(["dataclass", "pydantic", "typeddict", "namedtuple"])
    .default("dataclass")
    .describe("Python class style"),
  useOptional: z
    .boolean()
    .default(true)
    .describe("Use Optional for nullable fields"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Python classes"),
});

function toSnakeCase(s: string): string {
  return s
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
    .replace(/[^a-z0-9_]/g, "_");
}

function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]/g, "_")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function inferPyType(
  value: unknown,
  name: string,
  classes: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): string {
  if (value === null) return opts.useOptional ? "Optional[Any]" : "Any";
  switch (typeof value) {
    case "string":
      return "str";
    case "number":
      return Number.isInteger(value) ? "int" : "float";
    case "boolean":
      return "bool";
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return "List[Any]";
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
          return `List[${className}]`;
        }
        return `List[${inferPyType(first, name, classes, opts)}]`;
      }
      const className = toPascalCase(name);
      generateClass(value as Record<string, unknown>, className, classes, opts);
      return className;
    }
    default:
      return "Any";
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

  let result: string;
  const fieldEntries = Object.entries(obj).map(([key, value]) => {
    const pyName = toSnakeCase(key);
    let pyType = inferPyType(value, key, classes, opts);
    if (value === null && opts.useOptional) pyType = "Optional[Any]";
    return { pyName, pyType, origKey: key };
  });

  switch (opts.style) {
    case "dataclass": {
      const lines = [`@dataclass`, `class ${name}:`];
      for (const f of fieldEntries) {
        lines.push(`    ${f.pyName}: ${f.pyType}`);
      }
      result = lines.join("\n");
      break;
    }
    case "pydantic": {
      const lines = [`class ${name}(BaseModel):`];
      for (const f of fieldEntries) {
        if (f.pyName !== f.origKey) {
          lines.push(
            `    ${f.pyName}: ${f.pyType} = Field(alias="${f.origKey}")`
          );
        } else {
          lines.push(`    ${f.pyName}: ${f.pyType}`);
        }
      }
      result = lines.join("\n");
      break;
    }
    case "typeddict": {
      const lines = [`class ${name}(TypedDict):`];
      for (const f of fieldEntries) {
        lines.push(`    ${f.pyName}: ${f.pyType}`);
      }
      result = lines.join("\n");
      break;
    }
    case "namedtuple": {
      const fieldList = fieldEntries
        .map((f) => `("${f.pyName}", ${f.pyType})`)
        .join(", ");
      result = `${name} = NamedTuple("${name}", [${fieldList}])`;
      break;
    }
    default:
      result = "";
  }

  classes.set(name, result);
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const opts = {
    rootName: options?.rootName ?? "Root",
    style: options?.style ?? "dataclass",
    useOptional: options?.useOptional ?? true,
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
    return { output: `# JSON primitive type: ${typeof parsed}` };
  }

  // Build imports
  const imports: string[] = [];
  if (opts.style === "dataclass")
    imports.push("from dataclasses import dataclass");
  if (opts.style === "pydantic")
    imports.push("from pydantic import BaseModel, Field");
  if (opts.style === "typeddict") imports.push("from typing import TypedDict");
  if (opts.style === "namedtuple")
    imports.push("from typing import NamedTuple");
  imports.push("from typing import Any, List, Optional");

  const entries = [...classes.values()].reverse();
  return { output: imports.join("\n") + "\n\n\n" + entries.join("\n\n\n") };
}

export const jsonToPython = defineTool({
  meta: {
    id: "json/json-to-python",
    name: "JSON to Python",
    description:
      "Free online JSON to Python converter — generate Python dataclasses, Pydantic models, or TypedDicts from JSON instantly in your browser. No data is stored. Supports all four class styles with Optional types.",
    category: "json",
    subgroup: "Code Generation",
    tier: ToolTier.CLIENT,
    keywords: ["json", "python", "dataclass", "pydantic", "codegen"],
    ui: { inputLanguage: "json", outputLanguage: "python" },
    examples: [
      {
        title: "User Dataclass",
        description: "Generate a Python dataclass from a JSON user object",
        input:
          '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "active": true\n}',
        output:
          "from dataclasses import dataclass\nfrom typing import Any, List, Optional\n\n\n@dataclass\nclass Root:\n    id: int\n    name: str\n    email: str\n    active: bool",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
