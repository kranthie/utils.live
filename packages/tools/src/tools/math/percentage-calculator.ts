import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Input values (e.g., '25 of 200' or '50, 200')"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["of", "is-what-percent", "increase", "decrease"])
    .default("of")
    .describe(
      "Calculation mode: 'of' = X% of Y, 'is-what-percent' = X is what % of Y, 'increase' = increase X by Y%, 'decrease' = decrease X by Y%"
    ),
});

const outputSchema = z.object({
  output: z.string().describe("Percentage calculation result"),
});

function parseTwo(input: string): [number, number] {
  const cleaned = input.replace(/[%]/g, "").trim();
  const parts = cleaned.split(/[\s,]+of\s+|[\s,]+/).filter(Boolean);
  if (parts.length < 2 || !parts[0] || !parts[1])
    throw new Error(
      "Please provide two numbers (e.g., '25 of 200' or '50, 200')"
    );
  const a = parseFloat(parts[0]);
  const b = parseFloat(parts[1]);
  if (isNaN(a) || isNaN(b)) throw new Error("Invalid numbers");
  return [a, b];
}

export const percentageCalculator = defineTool({
  meta: {
    id: "math/percentage-calculator",
    name: "Percentage Calculator",
    description:
      "Free online Percentage Calculator — calculate percentages instantly in your browser. No data is stored. Supports X% of Y, X is what % of Y, increase by %, and decrease by % calculations.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["percentage", "percent", "calculate", "ratio", "proportion"],
    examples: [
      {
        title: "Calculate Percentage",
        description: "Calculate 15% of 250",
        input: "15 of 250",
        output: "15% of 250 = 37.5",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const [a, b] = parseTwo(input.input);
    const mode = options?.mode ?? "of";
    let result: number;
    let desc: string;
    switch (mode) {
      case "of":
        result = (a / 100) * b;
        desc = `${a}% of ${b} = ${result}`;
        break;
      case "is-what-percent":
        result = (a / b) * 100;
        desc = `${a} is ${result}% of ${b}`;
        break;
      case "increase":
        result = a * (1 + b / 100);
        desc = `${a} increased by ${b}% = ${result}`;
        break;
      case "decrease":
        result = a * (1 - b / 100);
        desc = `${a} decreased by ${b}% = ${result}`;
        break;
      default:
        throw new Error("Unknown mode");
    }
    return { output: desc };
  },
});
