import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Number to format (e.g., '1234567.89')"),
});

const optionsSchema = z.object({
  decimals: z.number().min(0).max(20).default(2).describe("Decimal places"),
  locale: z
    .enum(["en-US", "en-GB", "de-DE", "fr-FR", "ja-JP", "zh-CN", "pt-BR"])
    .default("en-US")
    .describe("Locale for formatting"),
  notation: z
    .enum(["standard", "scientific", "engineering", "compact"])
    .default("standard")
    .describe("Number notation"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted number"),
});

export const numberFormatter = defineTool({
  meta: {
    id: "math/number-formatter",
    name: "Number Formatter",
    description:
      "Free online Number Formatter — format numbers with locale-specific separators instantly in your browser. No data is stored. Supports commas, decimal places, scientific notation, compact notation, and multiple locales.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["number", "format", "commas", "decimal", "locale"],
    examples: [
      {
        title: "Format Large Number",
        description: "Format a large number with commas and 2 decimal places",
        input: "1234567.89",
        output: "1,234,567.89",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const locale = options?.locale ?? "en-US";
    const decimals = options?.decimals ?? 2;
    const notation = options?.notation ?? "standard";
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      notation,
    }).format(value);
    return { output: formatted };
  },
});
