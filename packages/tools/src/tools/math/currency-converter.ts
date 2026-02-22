import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const currencies = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "INR",
  "BRL",
] as const;

// Placeholder rates (not live)
const toUSD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  CAD: 0.74,
  AUD: 0.65,
  CHF: 1.13,
  CNY: 0.14,
  INR: 0.012,
  BRL: 0.2,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(currencies).default("USD").describe("Source currency"),
  to: z.enum(currencies).default("EUR").describe("Target currency"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value (placeholder rates - not live)"),
});

export const currencyConverter = defineTool({
  meta: {
    id: "math/currency-converter",
    name: "Currency Converter",
    description:
      "Free online Currency Converter — convert between currencies instantly in your browser. No data is stored. WARNING: Uses static approximate exchange rates, NOT live market data. Supports USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, and BRL.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["currency", "money", "convert", "usd", "eur", "exchange"],
    examples: [
      {
        title: "USD to EUR",
        description: "Convert 1000 US dollars to euros (placeholder rates)",
        input: "1000",
        output:
          "925.93\n\n⚠ WARNING: This result uses static approximate exchange rates, NOT live market data. Actual rates may differ significantly. Do not use for financial decisions.",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "USD";
    const to = options?.to ?? "EUR";
    const fromRate = toUSD[from];
    const toRate = toUSD[to];
    if (fromRate === undefined || toRate === undefined)
      throw new Error("Unknown currency");
    const usd = value * fromRate;
    const result = usd / toRate;
    return {
      output: `${result.toFixed(2)}\n\n⚠ WARNING: This result uses static approximate exchange rates, NOT live market data. Actual rates may differ significantly. Do not use for financial decisions.`,
    };
  },
});
