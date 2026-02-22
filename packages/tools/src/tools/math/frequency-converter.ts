import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["Hz", "kHz", "MHz", "GHz", "THz", "rpm"] as const;

const toHz: Record<string, number> = {
  Hz: 1,
  kHz: 1e3,
  MHz: 1e6,
  GHz: 1e9,
  THz: 1e12,
  rpm: 1 / 60,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("Hz").describe("Source unit"),
  to: z.enum(units).default("kHz").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const frequencyConverter = defineTool({
  meta: {
    id: "math/frequency-converter",
    name: "Frequency Converter",
    description:
      "Free online Frequency Converter — convert between frequency units instantly in your browser. No data is stored. Supports Hz, kHz, MHz, GHz, THz, and RPM.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["frequency", "convert", "hertz", "khz", "mhz", "ghz"],
    examples: [
      {
        title: "Hertz to Kilohertz",
        description: "Convert 44100 Hz (audio sample rate) to kilohertz",
        input: "44100",
        output: "44.1",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "Hz";
    const to = options?.to ?? "kHz";
    const fromFactor = toHz[from];
    const toFactor = toHz[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const hz = value * fromFactor;
    const result = hz / toFactor;
    return { output: `${result}` };
  },
});
