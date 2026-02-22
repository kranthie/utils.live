import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["C", "F", "K"] as const;

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("C").describe("Source unit"),
  to: z.enum(units).default("F").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

function convert(value: number, from: string, to: string): number {
  if (from === to) return value;
  // Convert to Celsius first
  let celsius: number;
  switch (from) {
    case "C":
      celsius = value;
      break;
    case "F":
      celsius = ((value - 32) * 5) / 9;
      break;
    case "K":
      celsius = value - 273.15;
      break;
    default:
      throw new Error(`Unknown unit: ${from}`);
  }
  // Convert from Celsius to target
  switch (to) {
    case "C":
      return celsius;
    case "F":
      return (celsius * 9) / 5 + 32;
    case "K":
      return celsius + 273.15;
    default:
      throw new Error(`Unknown unit: ${to}`);
  }
}

export const temperatureConverter = defineTool({
  meta: {
    id: "math/temperature-converter",
    name: "Temperature Converter",
    description:
      "Free online Temperature Converter — convert between temperature scales instantly in your browser. No data is stored. Supports Celsius, Fahrenheit, and Kelvin conversions.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["temperature", "convert", "celsius", "fahrenheit", "kelvin"],
    examples: [
      {
        title: "Celsius to Fahrenheit",
        description:
          "Convert 100 degrees Celsius (boiling point) to Fahrenheit",
        input: "100",
        output: "212",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "C";
    const to = options?.to ?? "F";
    const result = convert(value, from, to);
    return { output: `${result}` };
  },
});
