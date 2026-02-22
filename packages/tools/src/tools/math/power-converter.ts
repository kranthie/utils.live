import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["W", "kW", "MW", "hp", "PS", "BTUh", "ftlbs"] as const;

const toWatts: Record<string, number> = {
  W: 1,
  kW: 1000,
  MW: 1e6,
  hp: 745.7,
  PS: 735.499,
  BTUh: 0.293071,
  ftlbs: 1.35582,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("W").describe("Source unit"),
  to: z.enum(units).default("hp").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const powerConverter = defineTool({
  meta: {
    id: "math/power-converter",
    name: "Power Converter",
    description:
      "Free online Power Converter — convert between power units instantly in your browser. No data is stored. Supports watts, kilowatts, megawatts, horsepower, PS, BTU/h, and ft-lbs/s.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["power", "convert", "watts", "horsepower", "kilowatts"],
    examples: [
      {
        title: "Watts to Horsepower",
        description: "Convert 746 watts to horsepower",
        input: "746",
        output: "1.0004023065575969",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "W";
    const to = options?.to ?? "hp";
    const fromFactor = toWatts[from];
    const toFactor = toWatts[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const watts = value * fromFactor;
    const result = watts / toFactor;
    return { output: `${result}` };
  },
});
