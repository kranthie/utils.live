import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON data to generate Rust structs from"),
});

const optionsSchema = z.object({
  rootName: z.string().default("Root").describe("Name of the root struct"),
  deriveTraits: z
    .string()
    .default("Debug, Serialize, Deserialize")
    .describe("Derive traits (comma-separated)"),
  useOption: z
    .boolean()
    .default(true)
    .describe("Use Option<T> for nullable fields"),
  pubFields: z.boolean().default(true).describe("Make fields public"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Rust structs"),
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
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function inferRustType(
  value: unknown,
  name: string,
  structs: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): string {
  if (value === null)
    return opts.useOption ? "Option<serde_json::Value>" : "serde_json::Value";
  switch (typeof value) {
    case "string":
      return "String";
    case "number":
      return Number.isInteger(value) ? "i64" : "f64";
    case "boolean":
      return "bool";
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return "Vec<serde_json::Value>";
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
          const structName = toPascalCase(name);
          generateStruct(merged, structName, structs, opts);
          return `Vec<${structName}>`;
        }
        return `Vec<${inferRustType(first, name, structs, opts)}>`;
      }
      const structName = toPascalCase(name);
      generateStruct(
        value as Record<string, unknown>,
        structName,
        structs,
        opts
      );
      return structName;
    }
    default:
      return "serde_json::Value";
  }
}

function generateStruct(
  obj: Record<string, unknown>,
  name: string,
  structs: Map<string, string>,
  opts: z.infer<typeof optionsSchema>
): void {
  if (structs.has(name)) return;
  structs.set(name, "");

  const derive = opts.deriveTraits.trim();
  const pub = opts.pubFields ? "pub " : "";
  const fields: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const rustName = toSnakeCase(key);
    let rustType = inferRustType(value, key, structs, opts);
    if (value === null && opts.useOption) {
      rustType = "Option<serde_json::Value>";
    }
    if (rustName !== key) {
      fields.push(`    #[serde(rename = "${key}")]`);
    }
    fields.push(`    ${pub}${rustName}: ${rustType},`);
  }

  const lines: string[] = [];
  if (derive) lines.push(`#[derive(${derive})]`);
  lines.push(`pub struct ${name} {`);
  lines.push(fields.join("\n"));
  lines.push("}");

  structs.set(name, lines.join("\n"));
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const opts = {
    rootName: options?.rootName ?? "Root",
    deriveTraits: options?.deriveTraits ?? "Debug, Serialize, Deserialize",
    useOption: options?.useOption ?? true,
    pubFields: options?.pubFields ?? true,
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
  const header = "use serde::{Deserialize, Serialize};\n";

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
      output: `type ${opts.rootName} = ${typeof parsed === "string" ? "String" : typeof parsed === "number" ? "f64" : "bool"};`,
    };
  }

  const entries = [...structs.values()].reverse();
  return { output: header + "\n" + entries.join("\n\n") };
}

export const jsonToRust = defineTool({
  meta: {
    id: "json/json-to-rust",
    name: "JSON to Rust",
    description:
      "Free online JSON to Rust converter — generate Rust structs with serde derive macros from JSON data instantly in your browser. No data is stored. Configurable derive traits, pub fields, and Option types.",
    category: "json",
    subgroup: "Code Generation",
    tier: ToolTier.CLIENT,
    keywords: ["json", "rust", "struct", "serde", "codegen"],
    ui: { inputLanguage: "json", outputLanguage: "rust" },
    examples: [
      {
        title: "User Struct",
        description:
          "Generate a Rust struct with serde derive macros from a user object",
        input:
          '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "active": true\n}',
        output:
          "use serde::{Deserialize, Serialize};\n\n#[derive(Debug, Serialize, Deserialize)]\npub struct Root {\n    pub id: i64,\n    pub name: String,\n    pub email: String,\n    pub active: bool,\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
