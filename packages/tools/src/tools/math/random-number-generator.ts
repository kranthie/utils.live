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

    // Use crypto.getRandomValues for unbiased sampling. Math.random() with
    // Math.round() has well-known boundary bias (values exactly at min/max
    // appear at half the expected rate) which users of a "Random Number
    // Generator" tool reasonably do not expect.
    const nums: number[] = [];
    if (integers) {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      const range = hi - lo + 1;
      if (range <= 0) throw new Error("No integers in the given range");
      // Rejection sampling over a uint32 window to avoid modulo bias.
      const maxUnbiased = Math.floor(0x1_0000_0000 / range) * range;
      const buf = new Uint32Array(1);
      for (let i = 0; i < count; i++) {
        let r: number;
        do {
          crypto.getRandomValues(buf);
          r = buf[0]!;
        } while (r >= maxUnbiased);
        nums.push(lo + (r % range));
      }
    } else {
      const buf = new Uint32Array(1);
      for (let i = 0; i < count; i++) {
        crypto.getRandomValues(buf);
        const frac = buf[0]! / 0x1_0000_0000;
        nums.push(parseFloat((frac * (max - min) + min).toFixed(6)));
      }
    }
    return { output: nums.join(", ") };
  },
});
