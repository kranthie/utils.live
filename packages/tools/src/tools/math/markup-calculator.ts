import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  cost: z.number().min(0).default(50).describe("Cost price"),
  markupPercent: z.number().min(0).default(30).describe("Markup percentage"),
});

const outputSchema = z.object({
  output: z.string().describe("Markup calculation breakdown"),
});

export const markupCalculator = defineTool({
  meta: {
    id: "math/markup-calculator",
    name: "Markup Calculator",
    description:
      "Free online Markup Calculator — calculate markup and selling price instantly in your browser. No data is stored. Enter cost and markup percentage to see selling price, profit amount, and profit margin.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["markup", "cost", "price", "profit", "margin"],
    examples: [
      {
        title: "Product Markup",
        description: "Calculate selling price with a 40% markup on a $25 cost",
        input: { cost: 25, markupPercent: 40 },
        output:
          "Cost: $25.00\nMarkup: 40% (+$10.00)\nSelling Price: $35.00\nProfit Margin: 28.57%",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const cost = input.cost ?? 50;
    const markup = input.markupPercent ?? 30;
    const markupAmount = cost * (markup / 100);
    const sellingPrice = cost + markupAmount;
    const margin = (markupAmount / sellingPrice) * 100;
    const lines = [
      `Cost: $${cost.toFixed(2)}`,
      `Markup: ${markup}% (+$${markupAmount.toFixed(2)})`,
      `Selling Price: $${sellingPrice.toFixed(2)}`,
      `Profit Margin: ${margin.toFixed(2)}%`,
    ];
    return { output: lines.join("\n") };
  },
});
