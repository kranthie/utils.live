import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  principal: z
    .number()
    .min(0)
    .default(1000)
    .describe("Initial principal amount"),
  rate: z
    .number()
    .min(0)
    .max(100)
    .default(5)
    .describe("Annual interest rate (%)"),
  years: z.number().min(0).max(100).default(10).describe("Number of years"),
  compounding: z
    .enum(["annually", "semi-annually", "quarterly", "monthly", "daily"])
    .default("annually")
    .describe("Compounding frequency"),
});

const outputSchema = z.object({
  output: z.string().describe("Compound interest calculation"),
});

const frequencyMap: Record<string, number> = {
  annually: 1,
  "semi-annually": 2,
  quarterly: 4,
  monthly: 12,
  daily: 365,
};

export const compoundInterest = defineTool({
  meta: {
    id: "math/compound-interest",
    name: "Compound Interest Calculator",
    description:
      "Free online Compound Interest Calculator — calculate compound interest instantly in your browser. No data is stored. Supports annual, semi-annual, quarterly, monthly, and daily compounding frequencies.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["compound", "interest", "investment", "savings", "finance"],
    examples: [
      {
        title: "10-Year Investment",
        description:
          "Calculate compound interest on $10,000 at 7% for 10 years, compounded monthly",
        input: { principal: 10000, rate: 7, years: 10, compounding: "monthly" },
        output:
          "Principal: $10000.00\nAnnual Rate: 7.00%\nTime: 10 years\nCompounding: monthly\n\nFinal Amount: $20096.61\nTotal Interest: $10096.61",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const P = input.principal ?? 1000;
    const r = (input.rate ?? 5) / 100;
    const t = input.years ?? 10;
    const compounding = input.compounding ?? "annually";
    const n = frequencyMap[compounding];
    if (n === undefined) throw new Error("Unknown compounding frequency");
    const A = P * Math.pow(1 + r / n, n * t);
    const interest = A - P;
    const lines = [
      `Principal: $${P.toFixed(2)}`,
      `Annual Rate: ${(r * 100).toFixed(2)}%`,
      `Time: ${t} years`,
      `Compounding: ${input.compounding ?? "annually"}`,
      ``,
      `Final Amount: $${A.toFixed(2)}`,
      `Total Interest: $${interest.toFixed(2)}`,
    ];
    return { output: lines.join("\n") };
  },
});
