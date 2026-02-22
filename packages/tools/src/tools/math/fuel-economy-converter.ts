import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["mpg", "L100km", "kmL", "mpgUK"] as const;

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '30')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("mpg").describe("Source unit"),
  to: z.enum(units).default("L100km").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

function toKmPerLiter(value: number, from: string): number {
  switch (from) {
    case "mpg":
      return value * 0.425144;
    case "L100km":
      return 100 / value;
    case "kmL":
      return value;
    case "mpgUK":
      return value * 0.354006;
    default:
      throw new Error(`Unknown unit: ${from}`);
  }
}

function fromKmPerLiter(value: number, to: string): number {
  switch (to) {
    case "mpg":
      return value / 0.425144;
    case "L100km":
      return 100 / value;
    case "kmL":
      return value;
    case "mpgUK":
      return value / 0.354006;
    default:
      throw new Error(`Unknown unit: ${to}`);
  }
}

export const fuelEconomyConverter = defineTool({
  meta: {
    id: "math/fuel-economy-converter",
    name: "Fuel Economy Converter",
    description:
      "Free online Fuel Economy Converter — convert between fuel economy units instantly in your browser. No data is stored. Supports miles per gallon (US/UK), liters per 100 km, and kilometers per liter.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["fuel", "economy", "mpg", "l100km", "convert", "mileage"],
    examples: [
      {
        title: "MPG to L/100km",
        description: "Convert 30 miles per gallon to liters per 100 km",
        input: "30",
        output: "7.840480715553632",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value) || value <= 0)
      throw new Error("Invalid number (must be positive)");
    const from = options?.from ?? "mpg";
    const to = options?.to ?? "L100km";
    const kmPerLiter = toKmPerLiter(value, from);
    const result = fromKmPerLiter(kmPerLiter, to);
    return { output: `${result}` };
  },
});
