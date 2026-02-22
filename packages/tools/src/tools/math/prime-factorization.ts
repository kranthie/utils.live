import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Number to factorize"),
});

const outputSchema = z.object({
  output: z.string().describe("Prime factorization"),
});

function factorize(n: number): number[] {
  if (n < 2) return [];
  const factors: number[] = [];
  for (let d = 2; d * d <= n; d++) {
    while (n % d === 0) {
      factors.push(d);
      n /= d;
    }
  }
  if (n > 1) factors.push(n);
  return factors;
}

export const primeFactorization = defineTool({
  meta: {
    id: "math/prime-factorization",
    name: "Prime Factorization",
    description:
      "Free online Prime Factorization — factor any number into its prime factors instantly in your browser. No data is stored. Shows complete prime decomposition with exponent notation.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["prime", "factorization", "factors", "decompose", "divisor"],
    examples: [
      {
        title: "Factorize 360",
        description: "Find the prime factorization of 360",
        input: "360",
        output: "360 = 2^3 × 3^2 × 5",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const n = parseInt(input.input.trim(), 10);
    if (isNaN(n) || n < 2) throw new Error("Please provide an integer >= 2");
    const factors = factorize(n);
    const grouped = factors.reduce<Record<number, number>>((acc, f) => {
      acc[f] = (acc[f] || 0) + 1;
      return acc;
    }, {});
    const parts = Object.entries(grouped).map(([base, exp]) =>
      exp === 1 ? base : `${base}^${exp}`
    );
    return { output: `${n} = ${parts.join(" × ")}` };
  },
});
