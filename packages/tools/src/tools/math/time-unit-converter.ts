import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["ms", "s", "min", "h", "d", "wk", "mo", "yr"] as const;

const toSeconds: Record<string, number> = {
  ms: 0.001,
  s: 1,
  min: 60,
  h: 3600,
  d: 86400,
  wk: 604800,
  mo: 2592000,
  yr: 31536000,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("s").describe("Source unit"),
  to: z.enum(units).default("min").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const timeUnitConverter = defineTool({
  meta: {
    id: "math/time-unit-converter",
    name: "Time Unit Converter",
    description:
      "Free online Time Unit Converter — convert between time units instantly in your browser. No data is stored. Supports milliseconds, seconds, minutes, hours, days, weeks, months, and years.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["time", "convert", "seconds", "minutes", "hours", "days"],
    examples: [
      {
        title: "Seconds to Minutes",
        description: "Convert 3600 seconds to minutes",
        input: "3600",
        output: "60",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "s";
    const to = options?.to ?? "min";
    const fromFactor = toSeconds[from];
    const toFactor = toSeconds[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const seconds = value * fromFactor;
    const result = seconds / toFactor;
    return { output: `${result}` };
  },
});
