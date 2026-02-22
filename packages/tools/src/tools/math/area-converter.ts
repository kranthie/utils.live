import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = [
  "sqm",
  "sqkm",
  "sqft",
  "sqyd",
  "sqmi",
  "acre",
  "ha",
  "sqin",
  "sqcm",
] as const;

const toSqMeters: Record<string, number> = {
  sqm: 1,
  sqkm: 1e6,
  sqft: 0.092903,
  sqyd: 0.836127,
  sqmi: 2.59e6,
  acre: 4046.86,
  ha: 10000,
  sqin: 0.00064516,
  sqcm: 0.0001,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("sqm").describe("Source unit"),
  to: z.enum(units).default("sqft").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const areaConverter = defineTool({
  meta: {
    id: "math/area-converter",
    name: "Area Converter",
    description:
      "Free online Area Converter — convert between area units instantly in your browser. No data is stored. Supports square meters, square feet, acres, hectares, square kilometers, square yards, square inches, and square centimeters.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: [
      "area",
      "convert",
      "square",
      "meters",
      "feet",
      "acres",
      "hectares",
    ],
    examples: [
      {
        title: "Square Meters to Square Feet",
        description: "Convert 100 square meters to square feet",
        input: "100",
        output: "1076.3915051182416",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "sqm";
    const to = options?.to ?? "sqft";
    const fromFactor = toSqMeters[from];
    const toFactor = toSqMeters[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const sqMeters = value * fromFactor;
    const result = sqMeters / toFactor;
    return { output: `${result}` };
  },
});
