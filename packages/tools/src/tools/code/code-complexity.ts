import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JavaScript/TypeScript code to analyze"),
});

const outputSchema = z.object({
  output: z.string().describe("Complexity analysis report"),
  totalComplexity: z.number().describe("Total cyclomatic complexity"),
  functions: z
    .array(
      z.object({
        name: z.string(),
        complexity: z.number(),
        line: z.number(),
      })
    )
    .describe("Per-function complexity"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) throw new Error("Input cannot be empty");

  const lines = raw.split("\n");
  const functions: {
    name: string;
    complexity: number;
    line: number;
    startLine: number;
    endLine: number;
  }[] = [];

  // Count complexity indicators per function
  const complexityPatterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bdo\s*\{/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /\?\s*/g, // ternary
    /&&/g,
    /\|\|/g,
    /\?\?/g, // nullish coalescing
  ];

  // Simple approach: find functions, then count decision points inside
  let currentFunc: {
    name: string;
    startLine: number;
    braceCount: number;
  } | null = null;
  let currentComplexity = 1; // Start at 1 for each function
  let globalComplexity = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNo = i + 1;

    // Detect function declarations
    const funcMatch = line.match(
      /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))|(\w+)\s*\([^)]*\)\s*\{/
    );
    if (funcMatch && !currentFunc) {
      const name = funcMatch[1] || funcMatch[2] || funcMatch[3] || "anonymous";
      currentFunc = { name, startLine: lineNo, braceCount: 0 };
      currentComplexity = 1;
    }

    // Track braces
    if (currentFunc) {
      for (const ch of line) {
        if (ch === "{") currentFunc.braceCount++;
        if (ch === "}") currentFunc.braceCount--;
      }

      // Count complexity
      for (const pattern of complexityPatterns) {
        const matches = line.match(pattern);
        if (matches) {
          currentComplexity += matches.length;
        }
      }

      // Function ended
      if (currentFunc.braceCount <= 0 && line.includes("}")) {
        functions.push({
          name: currentFunc.name,
          complexity: currentComplexity,
          line: currentFunc.startLine,
          startLine: currentFunc.startLine,
          endLine: lineNo,
        });
        currentFunc = null;
      }
    } else {
      // Global scope complexity (line already declared above)
      for (const pattern of complexityPatterns) {
        const matches = line.match(pattern);
        if (matches) {
          globalComplexity += matches.length;
        }
      }
    }
  }

  const totalComplexity =
    functions.reduce((sum, f) => sum + f.complexity, 0) + globalComplexity;

  // Build report
  const report: string[] = [];
  report.push(`Cyclomatic Complexity Analysis`);
  report.push(`Total: ${totalComplexity}`);
  report.push(`Global scope: ${globalComplexity}`);
  report.push(`Functions: ${functions.length}`);
  report.push("");

  if (functions.length > 0) {
    report.push("Per-function breakdown:");
    const sorted = [...functions].sort((a, b) => b.complexity - a.complexity);
    for (const func of sorted) {
      const risk =
        func.complexity > 10
          ? " [HIGH]"
          : func.complexity > 5
            ? " [MODERATE]"
            : "";
      report.push(
        `  ${func.name} (line ${func.line}): ${func.complexity}${risk}`
      );
    }
  }

  report.push("");
  report.push("Legend: 1-5 = simple, 6-10 = moderate, 11+ = complex");

  return {
    output: report.join("\n"),
    totalComplexity,
    functions: functions.map((f) => ({
      name: f.name,
      complexity: f.complexity,
      line: f.line,
    })),
  };
}

export const codeComplexity = defineTool({
  meta: {
    id: "code/code-complexity",
    name: "Code Complexity Analyzer",
    description:
      "Free online code complexity analyzer — calculate cyclomatic complexity for JavaScript and TypeScript functions instantly in your browser. No data is stored. Reports per-function breakdown with risk levels (simple, moderate, complex).",
    category: "code",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["complexity", "cyclomatic", "analyze", "javascript", "quality"],
    examples: [
      {
        title: "Analyze function complexity",
        description: "Calculate cyclomatic complexity of JavaScript functions",
        input:
          "function validate(x) {\n  if (x > 0 && x < 100) {\n    return true;\n  } else if (x === 0) {\n    return null;\n  }\n  return false;\n}",
        output:
          "Cyclomatic Complexity Analysis\nTotal: 6\nGlobal scope: 1\nFunctions: 1\n\nPer-function breakdown:\n  validate (line 1): 5\n\nLegend: 1-5 = simple, 6-10 = moderate, 11+ = complex",
      },
    ],
    ui: { inputLanguage: "javascript" },
  },
  inputSchema,
  outputSchema,
  execute,
});
