import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("JavaScript/TypeScript code to analyze for dead code"),
});

const outputSchema = z.object({
  output: z.string().describe("Dead code analysis report"),
  unusedVariables: z.array(z.string()).describe("Potentially unused variables"),
  unusedFunctions: z.array(z.string()).describe("Potentially unused functions"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) throw new Error("Input cannot be empty");

  // Remove comments and strings for analysis
  let cleaned = raw;
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "");
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/"[^"]*"/g, '""');
  cleaned = cleaned.replace(/'[^']*'/g, "''");
  cleaned = cleaned.replace(/`[^`]*`/g, "``");

  // Find variable declarations
  const varDecls = new Map<string, number>();
  const varRegex = /(?:const|let|var)\s+(\w+)/g;
  let match;
  while ((match = varRegex.exec(cleaned)) !== null) {
    const name = match[1]!;
    const line = cleaned.substring(0, match.index).split("\n").length;
    varDecls.set(name, line);
  }

  // Find function declarations
  const funcDecls = new Map<string, number>();
  const funcRegex = /function\s+(\w+)/g;
  while ((match = funcRegex.exec(cleaned)) !== null) {
    const name = match[1]!;
    const line = cleaned.substring(0, match.index).split("\n").length;
    funcDecls.set(name, line);
  }

  // Also find arrow function assignments
  const arrowRegex =
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[\w]+)\s*=>/g;
  while ((match = arrowRegex.exec(cleaned)) !== null) {
    const name = match[1]!;
    const line = cleaned.substring(0, match.index).split("\n").length;
    funcDecls.set(name, line);
    varDecls.delete(name); // Move from vars to funcs
  }

  // Count usage (references beyond declaration)
  const unusedVariables: string[] = [];
  const unusedFunctions: string[] = [];

  // Skip common exports and special names
  const skipNames = new Set([
    "module",
    "exports",
    "require",
    "console",
    "process",
    "window",
    "document",
    "global",
  ]);

  for (const [name, line] of varDecls) {
    if (skipNames.has(name)) continue;
    // Count occurrences
    const regex = new RegExp(`\\b${name}\\b`, "g");
    const matches = cleaned.match(regex);
    const count = matches ? matches.length : 0;
    // If only appears once (the declaration), it's unused
    if (count <= 1) {
      unusedVariables.push(`${name} (line ${line})`);
    }
  }

  for (const [name, line] of funcDecls) {
    if (skipNames.has(name)) continue;
    const regex = new RegExp(`\\b${name}\\b`, "g");
    const matches = cleaned.match(regex);
    const count = matches ? matches.length : 0;
    if (count <= 1) {
      unusedFunctions.push(`${name} (line ${line})`);
    }
  }

  const report: string[] = [];
  report.push("Dead Code Analysis (Simple Static Check)");
  report.push("=========================================");
  report.push("");

  if (unusedVariables.length === 0 && unusedFunctions.length === 0) {
    report.push("No potentially unused code detected.");
  }

  if (unusedVariables.length > 0) {
    report.push(`Potentially unused variables (${unusedVariables.length}):`);
    for (const v of unusedVariables) {
      report.push(`  - ${v}`);
    }
    report.push("");
  }

  if (unusedFunctions.length > 0) {
    report.push(`Potentially unused functions (${unusedFunctions.length}):`);
    for (const f of unusedFunctions) {
      report.push(`  - ${f}`);
    }
    report.push("");
  }

  report.push("Note: This is a basic static analysis. Dynamic usage,");
  report.push("exports, and indirect references may not be detected.");

  return {
    output: report.join("\n"),
    unusedVariables: unusedVariables.map((v) => v.split(" (")[0]!),
    unusedFunctions: unusedFunctions.map((f) => f.split(" (")[0]!),
  };
}

export const deadCodeFinder = defineTool({
  meta: {
    id: "code/dead-code-finder",
    name: "Dead Code Finder",
    description:
      "Free online dead code finder — detect potentially unused variables and functions in JavaScript and TypeScript code instantly in your browser. No data is stored. Uses static analysis to identify declarations referenced only once.",
    category: "code",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: [
      "dead code",
      "unused",
      "variables",
      "functions",
      "analyze",
      "clean",
      "refactor",
      "lint",
      "javascript",
    ],
    examples: [
      {
        title: "Find unused declarations",
        description: "Detect unused variables and functions in JavaScript",
        input:
          "const API_URL = '/api';\nconst unused = 42;\nfunction helper() { return API_URL; }\nfunction orphan() { return 1; }\nhelper();",
        output:
          "Dead Code Analysis (Simple Static Check)\n=========================================\n\nPotentially unused variables (1):\n  - unused (line 2)\n\nPotentially unused functions (1):\n  - orphan (line 4)\n\nNote: This is a basic static analysis. Dynamic usage,\nexports, and indirect references may not be detected.",
      },
    ],
    ui: { inputLanguage: "javascript" },
  },
  inputSchema,
  outputSchema,
  execute,
});
