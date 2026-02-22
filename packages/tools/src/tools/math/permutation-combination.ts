import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("n and r values (e.g., '10, 3')"),
});

const outputSchema = z.object({
  output: z.string().describe("nPr and nCr results"),
});

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export const permutationCombination = defineTool({
  meta: {
    id: "math/permutation-combination",
    name: "Permutation & Combination",
    description:
      "Free online Permutation & Combination Calculator — calculate nPr and nCr instantly in your browser. No data is stored. Enter n and r values to compute permutations and combinations for probability and counting problems.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["permutation", "combination", "nPr", "nCr", "combinatorics"],
    examples: [
      {
        title: "Lottery Combinations",
        description: "Calculate combinations for choosing 6 from 49",
        input: "49, 6",
        output: "n = 49, r = 6\nP(49, 6) = 10068347520\nC(49, 6) = 13983816",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const parts = input.input
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (
      parts.length < 2 ||
      parts.some(isNaN) ||
      parts[0] === undefined ||
      parts[1] === undefined
    )
      throw new Error("Provide n and r (e.g., '10, 3')");
    const n = parts[0];
    const r = parts[1];
    if (!Number.isInteger(n) || !Number.isInteger(r))
      throw new Error("n and r must be integers");
    if (n < 0 || r < 0) throw new Error("n and r must be non-negative");
    if (r > n) throw new Error("r cannot be greater than n");
    if (n > 170) throw new Error("n too large (max 170)");

    const nPr = factorial(n) / factorial(n - r);
    const nCr = factorial(n) / (factorial(r) * factorial(n - r));

    const lines = [
      `n = ${n}, r = ${r}`,
      `P(${n}, ${r}) = ${nPr}`,
      `C(${n}, ${r}) = ${nCr}`,
    ];
    return { output: lines.join("\n") };
  },
});
