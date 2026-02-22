import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Numbers separated by commas or spaces"),
});

const outputSchema = z.object({
  output: z.string().describe("Statistical summary"),
});

export const statisticsCalculator = defineTool({
  meta: {
    id: "math/statistics-calculator",
    name: "Statistics Calculator",
    description:
      "Free online Statistics Calculator — calculate mean, median, mode, min, max, and sum instantly in your browser. No data is stored. Get a complete statistical summary including count, range, and frequency analysis.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["statistics", "mean", "median", "mode", "average", "sum"],
    examples: [
      {
        title: "Dataset Summary",
        description: "Calculate statistics for a dataset of sales figures",
        input: "120, 150, 130, 150, 180, 110, 145",
        output:
          "Count: 7\nSum: 985\nMean: 140.71428571428572\nMedian: 145\nMode: 150\nMin: 110\nMax: 180\nRange: 70",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const nums = input.input
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (nums.length === 0 || nums.some(isNaN))
      throw new Error("Provide valid numbers");
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 !== 0
        ? sorted[mid]!
        : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    for (const n of nums) {
      freq[n] = (freq[n] || 0) + 1;
      if (freq[n] > maxFreq) maxFreq = freq[n];
    }
    const modes = Object.entries(freq)
      .filter(([, f]) => f === maxFreq && maxFreq > 1)
      .map(([v]) => Number(v));
    const range = (sorted[sorted.length - 1] ?? 0) - (sorted[0] ?? 0);

    const lines = [
      `Count: ${nums.length}`,
      `Sum: ${sum}`,
      `Mean: ${mean}`,
      `Median: ${median}`,
      `Mode: ${modes.length > 0 ? modes.join(", ") : "No mode (all values unique)"}`,
      `Min: ${sorted[0]}`,
      `Max: ${sorted[sorted.length - 1]}`,
      `Range: ${range}`,
    ];
    return { output: lines.join("\n") };
  },
});
