import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JavaScript code to obfuscate"),
});

const outputSchema = z.object({
  output: z.string().describe("Obfuscated JavaScript code"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) throw new Error("Input cannot be empty");

  // Find variable declarations and rename them
  const varMap = new Map<string, string>();
  let counter = 0;

  function getObfuscatedName(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let result = "_";
    let n = counter++;
    do {
      result += chars[n % chars.length];
      n = Math.floor(n / chars.length);
    } while (n > 0);
    return result;
  }

  // Collect variable names from declarations
  const declRegex = /(?:var|let|const)\s+([a-zA-Z_$][\w$]*)/g;
  let match;
  while ((match = declRegex.exec(raw)) !== null) {
    const name = match[1]!;
    // Don't rename common globals or short names
    if (
      !varMap.has(name) &&
      name.length > 1 &&
      ![
        "console",
        "document",
        "window",
        "Math",
        "Date",
        "Array",
        "Object",
        "String",
        "Number",
        "Boolean",
        "Error",
        "Promise",
        "JSON",
        "undefined",
        "null",
        "true",
        "false",
        "this",
        "arguments",
        "require",
        "module",
        "exports",
        "process",
        "global",
      ].includes(name)
    ) {
      varMap.set(name, getObfuscatedName());
    }
  }

  // Also collect function names
  const funcRegex = /function\s+([a-zA-Z_$][\w$]*)/g;
  while ((match = funcRegex.exec(raw)) !== null) {
    const name = match[1]!;
    if (!varMap.has(name) && name.length > 1) {
      varMap.set(name, getObfuscatedName());
    }
  }

  // Replace names in code (simple word-boundary replace)
  let result = raw;
  for (const [original, obfuscated] of varMap) {
    const regex = new RegExp(`\\b${original}\\b`, "g");
    result = result.replace(regex, obfuscated);
  }

  // Remove comments
  result = result.replace(/\/\/[^\n]*/g, "");
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // Collapse whitespace
  result = result.replace(/\s+/g, " ").trim();

  return { output: result };
}

export const jsObfuscator = defineTool({
  meta: {
    id: "code/js-obfuscator",
    name: "JavaScript Obfuscator",
    description:
      "Free online JavaScript obfuscator — rename variables and functions to short identifiers, strip comments, and collapse whitespace instantly in your browser. No data is stored. Simple obfuscation via variable renaming.",
    category: "code",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["javascript", "obfuscate", "rename", "variables", "protect"],
    examples: [
      {
        title: "Obfuscate variable names",
        description: "Rename variables to make JavaScript harder to read",
        input:
          "const apiKey = 'secret123';\nfunction fetchData(url) {\n  return fetch(url);\n}",
        output:
          "const _a = 'secret123'; function _b(url) { return fetch(url); }",
      },
    ],
    ui: { inputLanguage: "javascript", outputLanguage: "javascript" },
  },
  inputSchema,
  outputSchema,
  execute,
});
