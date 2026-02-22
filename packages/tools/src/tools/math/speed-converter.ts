import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["kmh", "mph", "ms", "kn", "fts", "mach"] as const;

const toMs: Record<string, number> = {
  kmh: 1 / 3.6,
  mph: 0.44704,
  ms: 1,
  kn: 0.514444,
  fts: 0.3048,
  mach: 343,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("kmh").describe("Source unit"),
  to: z.enum(units).default("mph").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const speedConverter = defineTool({
  meta: {
    id: "math/speed-converter",
    name: "Speed Converter",
    description:
      "Free online Speed Converter — convert between speed units instantly in your browser. No data is stored. Supports km/h, mph, m/s, knots, ft/s, and Mach number.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["speed", "velocity", "convert", "kmh", "mph", "knots"],
    examples: [
      {
        title: "km/h to mph",
        description: "Convert 100 km/h to miles per hour",
        input: "100",
        output: "62.1371192237334",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "kmh";
    const to = options?.to ?? "mph";
    const fromFactor = toMs[from];
    const toFactor = toMs[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const ms = value * fromFactor;
    const result = ms / toFactor;
    return { output: `${result}` };
  },
});
