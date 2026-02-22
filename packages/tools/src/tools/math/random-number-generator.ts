import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  min: z.number().default(1).describe("Minimum value"),
  max: z.number().default(100).describe("Maximum value"),
  count: z
    .number()
    .min(1)
    .max(1000)
    .default(1)
    .describe("Number of random numbers"),
  integers: z.boolean().default(true).describe("Generate integers only"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated random numbers"),
});

export const randomNumberGenerator = defineTool({
  meta: {
    id: "math/random-number-generator",
    name: "Random Number Generator",
    description:
      "Free online Random Number Generator — generate random numbers in any range instantly in your browser. No data is stored. Supports integers and decimals, single or batch generation up to 1000 numbers.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["random", "number", "generator", "dice", "rng"],
    examples: [
      {
        title: "Roll 5 Dice",
        description: "Generate 5 random integers between 1 and 6",
        input: { min: 1, max: 6, count: 5, integers: true },
        output: "(Random output — varies with each execution)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const min = input.min ?? 1;
    const max = input.max ?? 100;
    const count = input.count ?? 1;
    const integers = input.integers ?? true;
    if (min > max) throw new Error("Min must be <= max");
    const nums: number[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random() * (max - min) + min;
      nums.push(integers ? Math.round(r) : parseFloat(r.toFixed(6)));
    }
    return { output: nums.join(", ") };
  },
});
