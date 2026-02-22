import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["J", "kJ", "cal", "kcal", "Wh", "kWh", "BTU", "eV"] as const;

const toJoules: Record<string, number> = {
  J: 1,
  kJ: 1000,
  cal: 4.184,
  kcal: 4184,
  Wh: 3600,
  kWh: 3.6e6,
  BTU: 1055.06,
  eV: 1.602e-19,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("J").describe("Source unit"),
  to: z.enum(units).default("cal").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const energyConverter = defineTool({
  meta: {
    id: "math/energy-converter",
    name: "Energy Converter",
    description:
      "Free online Energy Converter — convert between energy units instantly in your browser. No data is stored. Supports joules, kilojoules, calories, kilocalories, watt-hours, kilowatt-hours, BTU, and electron volts.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["energy", "convert", "joules", "calories", "kwh", "btu"],
    examples: [
      {
        title: "Joules to Calories",
        description: "Convert 1000 joules to calories",
        input: "1000",
        output: "239.0057361376673",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "J";
    const to = options?.to ?? "cal";
    const fromFactor = toJoules[from];
    const toFactor = toJoules[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const joules = value * fromFactor;
    const result = joules / toFactor;
    return { output: `${result}` };
  },
});
