import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  amount: z.number().min(0).default(100).describe("Amount"),
  vatRate: z
    .number()
    .min(0)
    .max(100)
    .default(20)
    .describe("VAT rate percentage"),
  mode: z.enum(["add", "remove"]).default("add").describe("Add or remove VAT"),
});

const outputSchema = z.object({
  output: z.string().describe("VAT calculation breakdown"),
});

export const vatCalculator = defineTool({
  meta: {
    id: "math/vat-calculator",
    name: "VAT Calculator",
    description:
      "Free online VAT Calculator — add or remove VAT from any amount instantly in your browser. No data is stored. Supports any VAT rate with net, gross, and VAT amount breakdown.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["vat", "tax", "calculator", "add", "remove", "sales-tax"],
    examples: [
      {
        title: "Add UK VAT",
        description: "Add 20% VAT to a 500 net amount",
        input: { amount: 500, vatRate: 20, mode: "add" },
        output:
          "Net Amount: $500.00\nVAT (20%): $100.00\nGross Amount: $600.00",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const amount = input.amount ?? 100;
    const rate = input.vatRate ?? 20;
    const mode = input.mode ?? "add";

    if (mode === "add") {
      const vat = amount * (rate / 100);
      const total = amount + vat;
      return {
        output: [
          `Net Amount: $${amount.toFixed(2)}`,
          `VAT (${rate}%): $${vat.toFixed(2)}`,
          `Gross Amount: $${total.toFixed(2)}`,
        ].join("\n"),
      };
    } else {
      const net = amount / (1 + rate / 100);
      const vat = amount - net;
      return {
        output: [
          `Gross Amount: $${amount.toFixed(2)}`,
          `VAT (${rate}%): $${vat.toFixed(2)}`,
          `Net Amount: $${net.toFixed(2)}`,
        ].join("\n"),
      };
    }
  },
});
