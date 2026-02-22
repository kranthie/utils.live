import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import jsYaml from "js-yaml";

const inputSchema = z.object({
  input: z.string().describe("YAML string to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const yamlValidator = defineTool({
  meta: {
    id: "validation/yaml-validator",
    name: "YAML Validator",
    description:
      "Free online YAML validator — check your YAML documents for syntax errors instantly in your browser. No data is stored. Validates indentation, key-value pairs, sequences, and nested structures.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "validate",
      "syntax",
      "format",
      "configuration",
      "indentation",
      "yml",
      "config",
    ],
    examples: [
      {
        title: "Valid YAML",
        description: "Validate a well-formed YAML document",
        input:
          "name: my-service\nversion: 1.0\nservices:\n  web:\n    port: 8080\n    host: localhost",
        output: "Valid YAML",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    if (!input.input.trim()) {
      return { output: "Empty YAML document", isValid: true };
    }
    try {
      jsYaml.load(input.input);
      return { output: "Valid YAML", isValid: true };
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unknown YAML parsing error";
      return {
        output: `Invalid YAML:\n  - ${message}`,
        isValid: false,
        errors: [message],
      };
    }
  },
});
