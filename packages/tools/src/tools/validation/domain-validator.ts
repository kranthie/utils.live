import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Domain name to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const domainValidator = defineTool({
  meta: {
    id: "validation/domain-validator",
    name: "Domain Validator",
    description:
      "Free online domain name validator — check if a domain name is properly formatted instantly in your browser. No data is stored. Validates labels, length limits, TLD presence, and RFC-compliant character usage.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "domain",
      "validate",
      "dns",
      "hostname",
      "format",
      "tld",
      "url",
      "website",
    ],
    examples: [
      {
        title: "Valid Domain",
        description: "Validate a standard domain name",
        input: "example.com",
        output: "Valid domain: example.com",
      },
      {
        title: "Invalid Domain",
        description: "Detect a domain with invalid characters",
        input: "my_domain.com",
        output: 'Invalid domain: Label "my_domain" contains invalid characters',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const domain = input.input.trim().toLowerCase();
    const errors: string[] = [];
    if (domain.length > 253) errors.push("Domain exceeds 253 characters");
    if (domain.startsWith(".") || domain.endsWith("."))
      errors.push("Cannot start or end with a dot");
    const labels = domain.split(".");
    if (labels.length < 2)
      errors.push("Must have at least two labels (e.g., example.com)");
    for (const label of labels) {
      if (label.length === 0) errors.push("Empty label found");
      if (label.length > 63)
        errors.push(`Label "${label}" exceeds 63 characters`);
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label)) {
        errors.push(`Label "${label}" contains invalid characters`);
      }
    }
    const isValid = errors.length === 0;
    return {
      output: isValid
        ? `Valid domain: ${domain}`
        : `Invalid domain: ${errors.join("; ")}`,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
