import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum(["any", "visa", "mastercard", "amex", "discover", "diners", "jcb"])
    .default("any")
    .describe("Credit card type"),
});

const outputSchema = z.object({
  output: z.string().describe("Credit card regex pattern and description"),
  pattern: z.string().describe("The regex pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const PATTERNS: Record<
  string,
  { pattern: string; desc: string; prefix: string }
> = {
  visa: {
    pattern: "^4\\d{12}(?:\\d{3})?$",
    desc: "Visa: starts with 4, 13 or 16 digits",
    prefix: "4",
  },
  mastercard: {
    pattern: "^5[1-5]\\d{14}$",
    desc: "Mastercard: starts with 51-55, 16 digits",
    prefix: "51-55",
  },
  amex: {
    pattern: "^3[47]\\d{13}$",
    desc: "American Express: starts with 34 or 37, 15 digits",
    prefix: "34, 37",
  },
  discover: {
    pattern: "^6(?:011|5\\d{2})\\d{12}$",
    desc: "Discover: starts with 6011 or 65, 16 digits",
    prefix: "6011, 65",
  },
  diners: {
    pattern: "^3(?:0[0-5]|[68]\\d)\\d{11}$",
    desc: "Diners Club: starts with 300-305, 36, or 38, 14 digits",
    prefix: "300-305, 36, 38",
  },
  jcb: {
    pattern: "^(?:2131|1800|35\\d{3})\\d{11}$",
    desc: "JCB: starts with 2131, 1800, or 35, 15-16 digits",
    prefix: "2131, 1800, 35",
  },
  any: {
    pattern:
      "^(?:4\\d{12}(?:\\d{3})?|5[1-5]\\d{14}|3[47]\\d{13}|6(?:011|5\\d{2})\\d{12}|3(?:0[0-5]|[68]\\d)\\d{11}|(?:2131|1800|35\\d{3})\\d{11})$",
    desc: "Matches all major credit card types",
    prefix: "Various",
  },
};

function execute(input: Input): Output {
  const p = PATTERNS[input.type]!;
  const lines: string[] = [];
  lines.push(`Credit Card Regex (${input.type}):`);
  lines.push("");
  lines.push(p.pattern);
  lines.push("");
  lines.push(p.desc);
  lines.push(`Prefix: ${p.prefix}`);
  lines.push("");
  lines.push("Note: This validates format only, not Luhn checksum.");

  return { output: lines.join("\n"), pattern: p.pattern };
}

export const creditCardRegex = defineTool({
  meta: {
    id: "regex/credit-card-regex",
    name: "Credit Card Regex",
    description:
      "Free online credit card regex generator — create validation patterns for Visa, Mastercard, Amex, Discover, Diners, and JCB cards instantly in your browser. No data is stored. Format-only validation with configurable card types.",
    category: "regex",
    subgroup: "Pattern Library",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "credit card",
      "validate",
      "visa",
      "mastercard",
      "payment",
      "luhn",
      "number",
      "format",
    ],
    examples: [
      {
        title: "Visa card number validation pattern",
        description: "Generate a regex pattern to validate Visa card numbers",
        input: "visa",
        output:
          "Credit Card Regex (visa):\n\n^4\\d{12}(?:\\d{3})?$\n\nVisa: starts with 4, 13 or 16 digits\nPrefix: 4\n\nNote: This validates format only, not Luhn checksum.",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
