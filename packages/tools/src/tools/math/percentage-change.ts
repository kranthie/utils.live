import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Two numbers: old and new value (e.g., '100, 150')"),
});

const outputSchema = z.object({
  output: z.string().describe("Percentage change result"),
});

export const percentageChange = defineTool({
  meta: {
    id: "math/percentage-change",
    name: "Percentage Change",
    description:
      "Free online Percentage Change Calculator — calculate percentage increase or decrease between two numbers instantly in your browser. No data is stored. Shows direction (increase/decrease) and exact percentage change.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["percentage", "change", "increase", "decrease", "difference"],
    examples: [
      {
        title: "Revenue Growth",
        description: "Calculate percentage change from 80000 to 95000",
        input: "80000, 95000",
        output: "18.75% increase (from 80000 to 95000)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const parts = input.input.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 2 || !parts[0] || !parts[1])
      throw new Error("Provide two numbers: old value and new value");
    const oldVal = parseFloat(parts[0]);
    const newVal = parseFloat(parts[1]);
    if (isNaN(oldVal) || isNaN(newVal)) throw new Error("Invalid numbers");
    if (oldVal === 0) throw new Error("Old value cannot be zero");
    const change = ((newVal - oldVal) / Math.abs(oldVal)) * 100;
    const direction = change >= 0 ? "increase" : "decrease";
    return {
      output: `${change.toFixed(2)}% ${direction} (from ${oldVal} to ${newVal})`,
    };
  },
});
