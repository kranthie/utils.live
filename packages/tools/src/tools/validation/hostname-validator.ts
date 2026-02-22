import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Hostname to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const hostnameValidator = defineTool({
  meta: {
    id: "validation/hostname-validator",
    name: "Hostname Validator",
    description:
      "Free online hostname validator — check if a hostname follows RFC 1123 format instantly in your browser. No data is stored. Validates label lengths, character sets, and overall hostname structure.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "hostname",
      "validate",
      "server",
      "rfc1123",
      "dns",
      "fqdn",
      "domain",
    ],
    examples: [
      {
        title: "Valid Hostname",
        description: "Validate a well-formed hostname",
        input: "web-server-01.us-east.example.com",
        output: "Valid hostname: web-server-01.us-east.example.com",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const hostname = input.input.trim().toLowerCase();
    const errors: string[] = [];
    if (hostname.length > 253) errors.push("Hostname exceeds 253 characters");
    if (hostname.length === 0) errors.push("Hostname is empty");
    const labels = hostname.split(".");
    for (const label of labels) {
      if (label.length === 0) errors.push("Empty label found");
      else if (label.length > 63)
        errors.push(`Label "${label}" exceeds 63 characters`);
      else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label)) {
        errors.push(`Label "${label}" contains invalid characters`);
      }
    }
    const isValid = errors.length === 0;
    return {
      output: isValid
        ? `Valid hostname: ${hostname}`
        : `Invalid hostname: ${errors.join("; ")}`,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
