import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON string to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const jsonValidator = defineTool({
  meta: {
    id: "validation/json-validator",
    name: "JSON Validator",
    description:
      "Free online JSON validator — check your JSON data for syntax errors instantly in your browser. No data is stored. Detects the top-level type (object, array, string, number, boolean, null) and validates structure.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "json",
      "validate",
      "syntax",
      "parse",
      "data",
      "api",
      "format",
      "object",
    ],
    examples: [
      {
        title: "Valid JSON Object",
        description: "Validate a well-formed JSON object",
        input: '{"name": "Alice", "age": 30, "active": true}',
        output: "Valid JSON (object)",
      },
      {
        title: "Invalid JSON",
        description: "Detect a trailing comma in JSON",
        input: '{"name": "Alice",}',
        output:
          "Invalid JSON: Expected double-quoted property name in JSON at position 17",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    try {
      const parsed = JSON.parse(input.input) as Record<string, unknown>;
      const type = Array.isArray(parsed) ? "array" : typeof parsed;
      return { output: `Valid JSON (${type})`, isValid: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown parse error";
      return { output: `Invalid JSON: ${msg}`, isValid: false, errors: [msg] };
    }
  },
});
