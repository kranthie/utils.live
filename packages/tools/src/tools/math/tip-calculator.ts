import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  amount: z.number().min(0).default(50).describe("Bill amount"),
  tipPercent: z.number().min(0).max(100).default(15).describe("Tip percentage"),
  split: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of people to split"),
});

const outputSchema = z.object({
  output: z.string().describe("Tip calculation breakdown"),
});

export const tipCalculator = defineTool({
  meta: {
    id: "math/tip-calculator",
    name: "Tip Calculator",
    description:
      "Free online Tip Calculator — calculate tips and split bills instantly in your browser. No data is stored. Enter bill amount, tip percentage, and number of people to see per-person totals and tip breakdown.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["tip", "calculator", "bill", "split", "restaurant"],
    examples: [
      {
        title: "Dinner Bill Split",
        description: "Calculate 18% tip on an $85 bill split 4 ways",
        input: { amount: 85, tipPercent: 18, split: 4 },
        output:
          "Bill Amount: $85.00\nTip (18%): $15.30\nTotal: $100.30\nSplit 4 ways: $25.07 per person\nTip per person: $3.82",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const amount = input.amount ?? 50;
    const tipPercent = input.tipPercent ?? 15;
    const split = input.split ?? 1;
    const tip = amount * (tipPercent / 100);
    const total = amount + tip;
    const perPerson = total / split;
    const tipPerPerson = tip / split;
    const lines = [
      `Bill Amount: $${amount.toFixed(2)}`,
      `Tip (${tipPercent}%): $${tip.toFixed(2)}`,
      `Total: $${total.toFixed(2)}`,
    ];
    if (split > 1) {
      lines.push(`Split ${split} ways: $${perPerson.toFixed(2)} per person`);
      lines.push(`Tip per person: $${tipPerPerson.toFixed(2)}`);
    }
    return { output: lines.join("\n") };
  },
});
