import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Two or more numbers separated by commas or spaces"),
});

const outputSchema = z.object({
  output: z.string().describe("GCD and LCM results"),
});

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export const gcdLcmCalculator = defineTool({
  meta: {
    id: "math/gcd-lcm-calculator",
    name: "GCD & LCM Calculator",
    description:
      "Free online GCD & LCM Calculator — calculate the greatest common divisor and least common multiple instantly in your browser. No data is stored. Supports two or more numbers with step-by-step results.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["gcd", "lcm", "greatest", "common", "divisor", "multiple"],
    examples: [
      {
        title: "GCD and LCM of Two Numbers",
        description: "Find GCD and LCM of 12 and 18",
        input: "12, 18",
        output: "GCD(12, 18) = 6\nLCM(12, 18) = 36",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const nums = input.input
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (nums.length < 2 || nums.some(isNaN))
      throw new Error("Provide at least two valid integers");
    const ints = nums.map((n) => Math.round(n));
    if (ints[0] === undefined) throw new Error("No numbers provided");
    let g = ints[0];
    let l = ints[0];
    for (let i = 1; i < ints.length; i++) {
      g = gcd(g, ints[i]!);
      l = lcm(l, ints[i]!);
    }
    return {
      output: `GCD(${ints.join(", ")}) = ${g}\nLCM(${ints.join(", ")}) = ${l}`,
    };
  },
});
