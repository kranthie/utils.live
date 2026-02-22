import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("JSON data to generate TypeScript interfaces from"),
});

const optionsSchema = z.object({
  rootName: z.string().default("Root").describe("Name of the root interface"),
  exportTypes: z.boolean().default(true).describe("Export all interfaces"),
  optionalFields: z
    .boolean()
    .default(false)
    .describe("Make all fields optional"),
  readonlyFields: z
    .boolean()
    .default(false)
    .describe("Make all fields readonly"),
  useType: z
    .boolean()
    .default(false)
    .describe("Use 'type' instead of 'interface'"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated TypeScript interfaces"),
});

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sanitizeName(name: string): string {
  // camelCase to PascalCase, handle special chars
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/(^_+|_+$)/g, "");
  return capitalize(
    cleaned.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())
  );
}

function inferType(
  value: unknown,
  name: string,
  interfaces: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return "unknown[]";
        // Check if all elements are same type
        const types = new Set(
          value.map((v) => {
            if (v === null) return "null";
            if (typeof v === "object" && !Array.isArray(v)) return "object";
            return typeof v;
          })
        );
        if (types.size === 1) {
          if (types.has("object")) {
            // Merge all object keys
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
            const itemName = sanitizeName(name) + "Item";
            generateInterface(merged, itemName, interfaces, opts);
            return `${itemName}[]`;
          }
          const first: unknown = value[0];
          return inferType(first, name, interfaces, opts) + "[]";
        }
        const unionTypes = [...types].map((t) => {
          if (t === "object") return "Record<string, unknown>";
          if (t === "null") return "null";
          return t;
        });
        return `(${unionTypes.join(" | ")})[]`;
      }
      // Object
      const interfaceName = sanitizeName(name);
      generateInterface(
        value as Record<string, unknown>,
        interfaceName,
        interfaces,
        opts
      );
      return interfaceName;
    }
    default:
      return "unknown";
  }
}

function generateInterface(
  obj: Record<string, unknown>,
  name: string,
  interfaces: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): void {
  if (interfaces.has(name)) return;

  const exportKw = opts.exportTypes ? "export " : "";
  const keyword = opts.useType ? "type" : "interface";
  const prefix = opts.readonlyFields ? "readonly " : "";
  const optional = opts.optionalFields ? "?" : "";
  const assign = opts.useType ? " = " : " ";

  const fields: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const tsType = inferType(value, key, interfaces, opts);
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
    fields.push(`  ${prefix}${safeKey}${optional}: ${tsType};`);
  }

  const opening = opts.useType ? "{" : "{";
  const closing = opts.useType ? "};" : "}";
  interfaces.set(
    name,
    `${exportKw}${keyword} ${name}${assign}${opening}\n${fields.join("\n")}\n${closing}`
  );
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const opts = {
    rootName: options?.rootName ?? "Root",
    exportTypes: options?.exportTypes ?? true,
    optionalFields: options?.optionalFields ?? false,
    readonlyFields: options?.readonlyFields ?? false,
    useType: options?.useType ?? false,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const interfaces = new Map<string, string>();

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
      generateInterface(merged, opts.rootName, interfaces, opts);
    } else {
      const itemType =
        parsed.length > 0
          ? inferType(parsed[0], "item", interfaces, opts)
          : "unknown";
      return {
        output: `${opts.exportTypes ? "export " : ""}type ${opts.rootName} = ${itemType}[];`,
      };
    }
  } else if (typeof parsed === "object" && parsed !== null) {
    generateInterface(
      parsed as Record<string, unknown>,
      opts.rootName,
      interfaces,
      opts
    );
  } else {
    const tsType = inferType(parsed, "value", interfaces, opts);
    return {
      output: `${opts.exportTypes ? "export " : ""}type ${opts.rootName} = ${tsType};`,
    };
  }

  // Output interfaces in reverse order (nested first, root last)
  const entries = [...interfaces.entries()].reverse();
  return { output: entries.map(([, def]) => def).join("\n\n") };
}

export const jsonToTypescript = defineTool({
  meta: {
    id: "json/json-to-typescript",
    name: "JSON to TypeScript",
    description:
      "Free online JSON to TypeScript converter — generate TypeScript interfaces from JSON data instantly in your browser. No data is stored. Supports optional fields, readonly, type aliases, and nested interfaces.",
    category: "json",
    subgroup: "Code Generation",
    tier: ToolTier.CLIENT,
    keywords: ["json", "typescript", "interface", "type", "codegen"],
    ui: { inputLanguage: "json", outputLanguage: "typescript" },
    examples: [
      {
        title: "User Object",
        description: "Generate a TypeScript interface from a JSON user object",
        input:
          '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "roles": ["admin", "user"]\n}',
        output:
          "export interface Root {\n  id: number;\n  name: string;\n  email: string;\n  roles: string[];\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
