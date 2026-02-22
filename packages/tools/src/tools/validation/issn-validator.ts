import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("ISSN to validate (e.g., '0378-5955')"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const issnValidator = defineTool({
  meta: {
    id: "validation/issn-validator",
    name: "ISSN Validator",
    description:
      "Free online ISSN validator — check if an International Standard Serial Number is valid instantly in your browser. No data is stored. Verifies the check digit and validates the 8-digit ISSN format.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "issn",
      "serial",
      "journal",
      "validate",
      "periodical",
      "publication",
      "check-digit",
    ],
    examples: [
      {
        title: "Valid ISSN",
        description: "Validate a valid ISSN (Hearing Research journal)",
        input: "0378-5955",
        output: "Valid ISSN: 0378-5955",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const raw = input.input.replace(/[-\s]/g, "").trim().toUpperCase();
    if (raw.length !== 8) {
      return {
        output: "Invalid ISSN length (must be 8 digits)",
        isValid: false,
        errors: ["Expected 8 characters (NNNN-NNNC)"],
      };
    }
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const ch = raw.charAt(i);
      if (!/\d/.test(ch))
        return {
          output: "Invalid ISSN characters",
          isValid: false,
          errors: ["First 7 characters must be digits"],
        };
      sum += parseInt(ch, 10) * (8 - i);
    }
    const remainder = sum % 11;
    const checkDigit =
      remainder === 0
        ? "0"
        : 11 - remainder === 10
          ? "X"
          : String(11 - remainder);
    const isValid = raw[7] === checkDigit;
    return {
      output: isValid
        ? `Valid ISSN: ${raw.slice(0, 4)}-${raw.slice(4)}`
        : `Invalid ISSN (expected check digit: ${checkDigit})`,
      isValid,
      errors: isValid
        ? undefined
        : [`Check digit mismatch: expected ${checkDigit}, got ${raw[7]}`],
    };
  },
});
