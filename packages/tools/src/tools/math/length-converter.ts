import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = [
  "km",
  "m",
  "cm",
  "mm",
  "mi",
  "yd",
  "ft",
  "in",
  "nm",
  "um",
] as const;

const toMeters: Record<string, number> = {
  km: 1000,
  m: 1,
  cm: 0.01,
  mm: 0.001,
  mi: 1609.344,
  yd: 0.9144,
  ft: 0.3048,
  in: 0.0254,
  nm: 1852,
  um: 0.000001,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("km").describe("Source unit"),
  to: z.enum(units).default("mi").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const lengthConverter = defineTool({
  meta: {
    id: "math/length-converter",
    name: "Length Converter",
    description:
      "Free online Length Converter — convert between length and distance units instantly in your browser. No data is stored. Supports kilometers, meters, centimeters, millimeters, miles, yards, feet, inches, and nautical miles.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: [
      "length",
      "distance",
      "convert",
      "km",
      "miles",
      "feet",
      "meters",
      "inches",
    ],
    examples: [
      {
        title: "Kilometers to Miles",
        description: "Convert a marathon distance (42.195 km) to miles",
        input: "42.195",
        output: "26.218757456454306",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "km";
    const to = options?.to ?? "mi";
    const fromFactor = toMeters[from];
    const toFactor = toMeters[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const meters = value * fromFactor;
    const result = meters / toFactor;
    return { output: `${result}` };
  },
});
