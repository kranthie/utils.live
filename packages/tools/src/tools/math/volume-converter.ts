import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = [
  "L",
  "mL",
  "gal",
  "qt",
  "pt",
  "cup",
  "floz",
  "tbsp",
  "tsp",
  "m3",
  "cm3",
] as const;

const toLiters: Record<string, number> = {
  L: 1,
  mL: 0.001,
  gal: 3.78541,
  qt: 0.946353,
  pt: 0.473176,
  cup: 0.236588,
  floz: 0.0295735,
  tbsp: 0.0147868,
  tsp: 0.00492892,
  m3: 1000,
  cm3: 0.001,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("L").describe("Source unit"),
  to: z.enum(units).default("gal").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const volumeConverter = defineTool({
  meta: {
    id: "math/volume-converter",
    name: "Volume Converter",
    description:
      "Free online Volume Converter — convert between volume units instantly in your browser. No data is stored. Supports liters, milliliters, gallons, quarts, pints, cups, fluid ounces, tablespoons, teaspoons, and cubic meters.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["volume", "convert", "liters", "gallons", "cups", "ml"],
    examples: [
      {
        title: "Liters to Gallons",
        description: "Convert 20 liters to US gallons",
        input: "20",
        output: "5.283443537159779",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "L";
    const to = options?.to ?? "gal";
    const fromFactor = toLiters[from];
    const toFactor = toLiters[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const liters = value * fromFactor;
    const result = liters / toFactor;
    return { output: `${result}` };
  },
});
