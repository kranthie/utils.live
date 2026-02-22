import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import toml from "@iarna/toml";

const inputSchema = z.object({
  input: z.string().describe("TOML string to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const tomlValidator = defineTool({
  meta: {
    id: "validation/toml-validator",
    name: "TOML Validator",
    description:
      "Free online TOML validator — check your TOML configuration files for syntax errors instantly in your browser. No data is stored. Validates tables, key-value pairs, arrays, and inline tables.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "toml",
      "validate",
      "config",
      "syntax",
      "configuration",
      "cargo",
      "pyproject",
      "settings",
    ],
    examples: [
      {
        title: "Valid TOML Config",
        description: "Validate a TOML configuration file",
        input:
          '[package]\nname = "my-app"\nversion = "1.0.0"\n\n[dependencies]\nrequest = "^2.88.0"',
        output: "Valid TOML",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    if (!input.input.trim()) {
      return { output: "Empty TOML document", isValid: true };
    }
    try {
      toml.parse(input.input);
      return { output: "Valid TOML", isValid: true };
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unknown TOML parsing error";
      return {
        output: `TOML issues:\n  - ${message}`,
        isValid: false,
        errors: [message],
      };
    }
  },
});
