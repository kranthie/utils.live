import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Email address to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean().describe("Whether input is valid"),
  errors: z.array(z.string()).optional().describe("List of errors found"),
});

export const emailValidator = defineTool({
  meta: {
    id: "validation/email-validator",
    name: "Email Validator",
    description:
      "Free online email address validator — check if an email follows RFC 5322 format instantly in your browser. No data is stored. Validates local part, domain, and overall structure.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "email",
      "validate",
      "format",
      "rfc5322",
      "address",
      "mail",
      "smtp",
    ],
    examples: [
      {
        title: "Valid Email",
        description: "Validate a standard email address",
        input: "user@example.com",
        output: "Valid email: user@example.com",
      },
      {
        title: "Invalid Email",
        description: "Detect a malformed email address",
        input: "user@.com",
        output: "Invalid email: Domain cannot start with a dot",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const email = input.input.trim();
    const errors: string[] = [];

    if (!email) {
      errors.push("Email is empty");
    }
    if (!email.includes("@")) {
      errors.push("Missing @ symbol");
    } else {
      const [local, domain] = email.split("@");
      if (!local) errors.push("Missing local part (before @)");
      if (!domain) errors.push("Missing domain part (after @)");
      if (local && local.length > 64)
        errors.push("Local part exceeds 64 characters");
      if (domain && domain.length > 253)
        errors.push("Domain part exceeds 253 characters");
      if (domain && !domain.includes("."))
        errors.push("Domain must contain at least one dot");
      if (domain && domain.startsWith("."))
        errors.push("Domain cannot start with a dot");
      if (domain && domain.endsWith("."))
        errors.push("Domain cannot end with a dot");
      if (local && (local.startsWith(".") || local.endsWith(".")))
        errors.push("Local part cannot start or end with a dot");
      if (local && local.includes(".."))
        errors.push("Local part cannot contain consecutive dots");
    }

    // RFC 5322 regex (simplified)
    const re =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (email && !re.test(email) && errors.length === 0)
      errors.push("Email does not match standard format");

    const isValid = errors.length === 0;
    return {
      output: isValid
        ? `Valid email: ${email}`
        : `Invalid email: ${errors.join("; ")}`,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
