import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Phone number to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const phoneValidator = defineTool({
  meta: {
    id: "validation/phone-validator",
    name: "Phone Validator",
    description:
      "Free online phone number validator — check if a phone number follows international E.164 format instantly in your browser. No data is stored. Validates digit count and country code prefix.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "phone",
      "validate",
      "telephone",
      "number",
      "international",
      "e164",
      "mobile",
      "country-code",
    ],
    examples: [
      {
        title: "Valid Phone (E.164)",
        description: "Validate an international phone number in E.164 format",
        input: "+1-555-123-4567",
        output: "Valid phone number: +1-555-123-4567 (11 digits)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const phone = input.input.trim();
    const errors: string[] = [];
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) errors.push("Too few digits (minimum 7)");
    if (digits.length > 15)
      errors.push("Too many digits (maximum 15 per E.164)");
    // E.164 format check
    const e164 = /^\+?[1-9]\d{6,14}$/.test(phone.replace(/[\s\-().]/g, ""));
    if (!e164 && errors.length === 0)
      errors.push("Does not match E.164 international format");

    const isValid = errors.length === 0;
    return {
      output: isValid
        ? `Valid phone number: ${phone} (${digits.length} digits)`
        : `Invalid: ${errors.join("; ")}`,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
