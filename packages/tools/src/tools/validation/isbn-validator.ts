import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("ISBN to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

function validateISBN10(isbn: string): boolean {
  if (isbn.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const ch = isbn.charAt(i);
    if (!/\d/.test(ch)) return false;
    sum += parseInt(ch, 10) * (10 - i);
  }
  const last = isbn.charAt(9).toUpperCase();
  sum += last === "X" ? 10 : parseInt(last, 10);
  if (isNaN(sum)) return false;
  return sum % 11 === 0;
}

function validateISBN13(isbn: string): boolean {
  if (isbn.length !== 13 || !/^\d{13}$/.test(isbn)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn.charAt(i), 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(isbn.charAt(12), 10);
}

export const isbnValidator = defineTool({
  meta: {
    id: "validation/isbn-validator",
    name: "ISBN Validator",
    description:
      "Free online ISBN validator — check if an ISBN-10 or ISBN-13 number is valid instantly in your browser. No data is stored. Verifies check digits and normalizes the ISBN for both formats.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "isbn",
      "book",
      "validate",
      "isbn10",
      "isbn13",
      "publishing",
      "barcode",
      "check-digit",
    ],
    examples: [
      {
        title: "Valid ISBN-13",
        description: "Validate an ISBN-13 number (e.g., for a published book)",
        input: "978-0-13-468599-1",
        output: "Valid ISBN-13: 9780134685991",
      },
      {
        title: "Valid ISBN-10",
        description: "Validate a classic ISBN-10 number",
        input: "0-306-40615-2",
        output: "Valid ISBN-10: 0306406152",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const raw = input.input.replace(/[-\s]/g, "").trim();
    if (raw.length === 10) {
      const isValid = validateISBN10(raw);
      return {
        output: isValid
          ? `Valid ISBN-10: ${raw}`
          : "Invalid ISBN-10 (checksum failed)",
        isValid,
        errors: isValid ? undefined : ["ISBN-10 checksum validation failed"],
      };
    }
    if (raw.length === 13) {
      const isValid = validateISBN13(raw);
      return {
        output: isValid
          ? `Valid ISBN-13: ${raw}`
          : "Invalid ISBN-13 (checksum failed)",
        isValid,
        errors: isValid ? undefined : ["ISBN-13 checksum validation failed"],
      };
    }
    return {
      output: "Invalid ISBN length (must be 10 or 13 digits)",
      isValid: false,
      errors: ["Expected 10 or 13 digits"],
    };
  },
});
