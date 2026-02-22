import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Credit card number to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

function luhnCheck(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num.charAt(i), 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function getCardType(num: string): string {
  if (/^4/.test(num)) return "Visa";
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "American Express";
  if (/^6(?:011|5)/.test(num)) return "Discover";
  if (/^3(?:0[0-5]|[68])/.test(num)) return "Diners Club";
  if (/^35/.test(num)) return "JCB";
  return "Unknown";
}

export const creditCardValidator = defineTool({
  meta: {
    id: "validation/credit-card-validator",
    name: "Credit Card Validator",
    description:
      "Free online credit card validator — check if a card number passes the Luhn algorithm instantly in your browser. No data is stored. Detects card type (Visa, Mastercard, Amex, Discover) and masks the number for display.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "credit",
      "card",
      "luhn",
      "validate",
      "payment",
      "visa",
      "mastercard",
      "amex",
      "discover",
      "check-digit",
    ],
    examples: [
      {
        title: "Valid Visa Card",
        description: "Validate a Visa test card number (Luhn-valid)",
        input: "4111 1111 1111 1111",
        output: "Valid card number\nType: Visa\nMasked: 4111 **** **** 1111",
      },
      {
        title: "Invalid Card Number",
        description: "Detect a card number that fails the Luhn check",
        input: "1234567890123456",
        output: "Invalid card number: Luhn check failed",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const num = input.input.replace(/[\s-]/g, "");
    const errors: string[] = [];
    if (!/^\d+$/.test(num)) errors.push("Must contain only digits");
    if (num.length < 13 || num.length > 19)
      errors.push("Length must be 13-19 digits");
    if (errors.length === 0 && !luhnCheck(num))
      errors.push("Luhn check failed");
    const isValid = errors.length === 0;
    if (isValid) {
      const type = getCardType(num);
      const masked = num.slice(0, 4) + " **** **** " + num.slice(-4);
      return {
        output: `Valid card number\nType: ${type}\nMasked: ${masked}`,
        isValid: true,
      };
    }
    return {
      output: `Invalid card number: ${errors.join("; ")}`,
      isValid: false,
      errors,
    };
  },
});
