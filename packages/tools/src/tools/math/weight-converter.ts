import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["kg", "g", "mg", "lb", "oz", "ton", "st", "ug"] as const;

const toGrams: Record<string, number> = {
  kg: 1000,
  g: 1,
  mg: 0.001,
  lb: 453.592,
  oz: 28.3495,
  ton: 907185,
  st: 6350.29,
  ug: 0.000001,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("kg").describe("Source unit"),
  to: z.enum(units).default("lb").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const weightConverter = defineTool({
  meta: {
    id: "math/weight-converter",
    name: "Weight Converter",
    description:
      "Free online Weight Converter — convert between weight and mass units instantly in your browser. No data is stored. Supports kilograms, grams, milligrams, pounds, ounces, tons, stones, and micrograms.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["weight", "mass", "convert", "kg", "lbs", "oz", "grams"],
    examples: [
      {
        title: "Kilograms to Pounds",
        description: "Convert 75 kg to pounds",
        input: "75",
        output: "165.34683151378331",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "kg";
    const to = options?.to ?? "lb";
    const fromFactor = toGrams[from];
    const toFactor = toGrams[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const grams = value * fromFactor;
    const result = grams / toFactor;
    return { output: `${result}` };
  },
});
