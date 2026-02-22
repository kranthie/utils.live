import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["N", "kN", "lbf", "dyn", "kgf", "ozf"] as const;

const toNewtons: Record<string, number> = {
  N: 1,
  kN: 1000,
  lbf: 4.44822,
  dyn: 0.00001,
  kgf: 9.80665,
  ozf: 0.278014,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("N").describe("Source unit"),
  to: z.enum(units).default("lbf").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const forceConverter = defineTool({
  meta: {
    id: "math/force-converter",
    name: "Force Converter",
    description:
      "Free online Force Converter — convert between force units instantly in your browser. No data is stored. Supports newtons, kilonewtons, pounds-force, dynes, kilogram-force, and ounce-force.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["force", "convert", "newtons", "pounds", "dynes", "kilonewtons"],
    examples: [
      {
        title: "Newtons to Pounds-force",
        description: "Convert 100 Newtons to pounds-force",
        input: "100",
        output: "22.48090247334889",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "N";
    const to = options?.to ?? "lbf";
    const fromFactor = toNewtons[from];
    const toFactor = toNewtons[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const newtons = value * fromFactor;
    const result = newtons / toFactor;
    return { output: `${result}` };
  },
});
