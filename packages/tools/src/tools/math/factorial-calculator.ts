import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Non-negative integer (e.g., '10')"),
});

const outputSchema = z.object({
  output: z.string().describe("Factorial result"),
});

export const factorialCalculator = defineTool({
  meta: {
    id: "math/factorial-calculator",
    name: "Factorial Calculator",
    description:
      "Free online Factorial Calculator — calculate the factorial of any number instantly in your browser. No data is stored. Supports values up to 170! with instant results.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["factorial", "math", "combinatorics", "permutation", "number"],
    examples: [
      {
        title: "Factorial of 10",
        description: "Calculate 10 factorial",
        input: "10",
        output: "10! = 3628800",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const n = parseInt(input.input.trim(), 10);
    if (isNaN(n) || n < 0)
      throw new Error("Please provide a non-negative integer");
    if (n > 170) throw new Error("Result too large (max input is 170)");
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return { output: `${n}! = ${result}` };
  },
});
