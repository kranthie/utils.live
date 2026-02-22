import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  weight: z.number().min(1).max(500).default(70).describe("Weight in kg"),
  height: z.number().min(0.3).max(3).default(1.75).describe("Height in meters"),
});

const outputSchema = z.object({
  output: z.string().describe("BMI result and category"),
});

function getCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export const bmiCalculator = defineTool({
  meta: {
    id: "math/bmi-calculator",
    name: "BMI Calculator",
    description:
      "Free online BMI Calculator — calculate your Body Mass Index instantly in your browser. No data is stored. Enter weight in kg and height in meters to get BMI value and health category.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["bmi", "body", "mass", "index", "health", "weight"],
    examples: [
      {
        title: "Normal BMI",
        description: "Calculate BMI for a 70 kg person who is 1.75 m tall",
        input: { weight: 70, height: 1.75 },
        output:
          "Weight: 70 kg\nHeight: 1.75 m\nBMI: 22.9\nCategory: Normal weight",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const weight = input.weight ?? 70;
    const height = input.height ?? 1.75;
    const bmi = weight / (height * height);
    const category = getCategory(bmi);
    const lines = [
      `Weight: ${weight} kg`,
      `Height: ${height} m`,
      `BMI: ${bmi.toFixed(1)}`,
      `Category: ${category}`,
    ];
    return { output: lines.join("\n") };
  },
});
