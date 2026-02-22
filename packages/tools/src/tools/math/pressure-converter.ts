import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = [
  "Pa",
  "kPa",
  "MPa",
  "bar",
  "atm",
  "psi",
  "torr",
  "mmHg",
] as const;

const toPascal: Record<string, number> = {
  Pa: 1,
  kPa: 1000,
  MPa: 1e6,
  bar: 100000,
  atm: 101325,
  psi: 6894.76,
  torr: 133.322,
  mmHg: 133.322,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("psi").describe("Source unit"),
  to: z.enum(units).default("bar").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const pressureConverter = defineTool({
  meta: {
    id: "math/pressure-converter",
    name: "Pressure Converter",
    description:
      "Free online Pressure Converter — convert between pressure units instantly in your browser. No data is stored. Supports pascal, kilopascal, megapascal, bar, atmosphere, PSI, torr, and mmHg.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["pressure", "convert", "psi", "bar", "atm", "pascal"],
    examples: [
      {
        title: "PSI to Bar",
        description: "Convert 14.7 PSI (atmospheric pressure) to bar",
        input: "14.7",
        output: "1.01352972",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "psi";
    const to = options?.to ?? "bar";
    const fromFactor = toPascal[from];
    const toFactor = toPascal[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const pascal = value * fromFactor;
    const result = pascal / toFactor;
    return { output: `${result}` };
  },
});
