import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  originalPrice: z.number().min(0).default(100).describe("Original price"),
  discountPercent: z
    .number()
    .min(0)
    .max(100)
    .default(20)
    .describe("Discount percentage"),
});

const outputSchema = z.object({
  output: z.string().describe("Discount calculation breakdown"),
});

export const discountCalculator = defineTool({
  meta: {
    id: "math/discount-calculator",
    name: "Discount Calculator",
    description:
      "Free online Discount Calculator — calculate sale prices and savings instantly in your browser. No data is stored. Enter original price and discount percentage to see final price, amount saved, and discount breakdown.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["discount", "sale", "price", "savings", "percent", "coupon"],
    examples: [
      {
        title: "25% Off Sale",
        description: "Calculate a 25% discount on a $79.99 item",
        input: { originalPrice: 79.99, discountPercent: 25 },
        output:
          "Original Price: $79.99\nDiscount: 25% (-$20.00)\nFinal Price: $59.99\nYou Save: $20.00",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const price = input.originalPrice ?? 100;
    const discount = input.discountPercent ?? 20;
    const savings = price * (discount / 100);
    const finalPrice = price - savings;
    const lines = [
      `Original Price: $${price.toFixed(2)}`,
      `Discount: ${discount}% (-$${savings.toFixed(2)})`,
      `Final Price: $${finalPrice.toFixed(2)}`,
      `You Save: $${savings.toFixed(2)}`,
    ];
    return { output: lines.join("\n") };
  },
});
