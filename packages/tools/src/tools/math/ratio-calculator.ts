import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Ratio to simplify (e.g., '16:9' or '100, 50')"),
});

const outputSchema = z.object({
  output: z.string().describe("Simplified ratio"),
});

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export const ratioCalculator = defineTool({
  meta: {
    id: "math/ratio-calculator",
    name: "Ratio Calculator",
    description:
      "Free online Ratio Calculator — simplify ratios to their simplest form instantly in your browser. No data is stored. Reduce any ratio using GCD-based simplification with support for decimals.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["ratio", "simplify", "proportion", "reduce", "aspect"],
    examples: [
      {
        title: "Simplify Screen Ratio",
        description: "Simplify a 1920:1080 screen resolution ratio",
        input: "1920:1080",
        output: "16:9",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const cleaned = input.input.trim();
    const parts = cleaned.split(/[:\s,]+/).filter(Boolean);
    if (parts.length < 2)
      throw new Error("Please provide two numbers (e.g., '16:9')");
    const nums = parts.map((p) => parseFloat(p));
    if (nums.some(isNaN)) throw new Error("Invalid numbers");

    // Find GCD of all numbers (work with integers by scaling)
    const scale = Math.pow(
      10,
      Math.max(
        ...nums.map((n) => {
          const s = n.toString();
          const d = s.indexOf(".");
          return d === -1 ? 0 : s.length - d - 1;
        })
      )
    );
    const ints = nums.map((n) => Math.round(n * scale));
    if (ints[0] === undefined) throw new Error("No numbers");
    let g = ints[0];
    for (let i = 1; i < ints.length; i++) {
      g = gcd(g, ints[i]!);
    }
    if (g === 0) throw new Error("Cannot simplify ratio with zero");
    const simplified = ints.map((n) => n / g);
    return { output: simplified.join(":") };
  },
});
