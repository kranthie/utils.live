import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe("Number of Fibonacci numbers to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Fibonacci sequence"),
});

export const fibonacciGenerator = defineTool({
  meta: {
    id: "math/fibonacci-generator",
    name: "Fibonacci Generator",
    description:
      "Free online Fibonacci Generator — generate Fibonacci sequences instantly in your browser. No data is stored. Generate up to 100 numbers in the Fibonacci sequence.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["fibonacci", "sequence", "generator", "math", "golden-ratio"],
    examples: [
      {
        title: "First 10 Fibonacci Numbers",
        description: "Generate the first 10 numbers in the Fibonacci sequence",
        input: { count: 10 },
        output: "0, 1, 1, 2, 3, 5, 8, 13, 21, 34",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const count = input.count ?? 10;
    const seq: number[] = [];
    let a = 0,
      b = 1;
    for (let i = 0; i < count; i++) {
      seq.push(a);
      [a, b] = [b, a + b];
    }
    return { output: seq.join(", ") };
  },
});
