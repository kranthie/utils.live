import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Numbers separated by commas or spaces"),
});

const optionsSchema = z.object({
  type: z
    .enum(["population", "sample"])
    .default("population")
    .describe("Population or sample standard deviation"),
});

const outputSchema = z.object({
  output: z.string().describe("Standard deviation result"),
});

export const standardDeviation = defineTool({
  meta: {
    id: "math/standard-deviation",
    name: "Standard Deviation",
    description:
      "Free online Standard Deviation Calculator — calculate standard deviation and variance instantly in your browser. No data is stored. Supports both population and sample standard deviation with mean, variance, and spread analysis.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["standard", "deviation", "variance", "statistics", "spread"],
    examples: [
      {
        title: "Test Scores",
        description: "Calculate the standard deviation of exam scores",
        input: "85, 90, 78, 92, 88, 76, 95, 89",
        output:
          "Type: population\nMean: 86.625\nVariance: 38.484375\nStandard Deviation: 6.203577596838779",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const nums = input.input
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (nums.length === 0 || nums.some(isNaN))
      throw new Error("Provide valid numbers");
    const type = options?.type ?? "population";
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const sqDiffs = nums.map((n) => (n - mean) ** 2);
    const divisor = type === "population" ? nums.length : nums.length - 1;
    if (divisor === 0)
      throw new Error("Need at least 2 values for sample standard deviation");
    const variance = sqDiffs.reduce((a, b) => a + b, 0) / divisor;
    const stdDev = Math.sqrt(variance);
    const lines = [
      `Type: ${type}`,
      `Mean: ${mean}`,
      `Variance: ${variance}`,
      `Standard Deviation: ${stdDev}`,
    ];
    return { output: lines.join("\n") };
  },
});
