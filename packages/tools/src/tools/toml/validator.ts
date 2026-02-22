import { z } from "zod";
import TOML from "@iarna/toml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("TOML string to validate"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the TOML is valid"),
  error: z.string().optional().describe("Error message if invalid"),
  line: z.number().optional().describe("Error line number if available"),
  column: z.number().optional().describe("Error column number if available"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Validates a TOML string.
 */
function execute(input: Input): Output {
  try {
    TOML.parse(input.input);
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid TOML";
    const tomlError = err as { line?: number; col?: number };

    return {
      valid: false,
      error: message,
      line: tomlError.line,
      column: tomlError.col,
    };
  }
}

/**
 * TOML Validator tool.
 * Validates TOML syntax.
 */
export const tomlValidator = defineTool({
  meta: {
    id: "toml/validator",
    name: "TOML Validator",
    description:
      "Free online TOML validator — check your TOML syntax for errors instantly in your browser. No data is stored. Reports error location with line and column numbers for quick debugging.",
    category: "toml",
    tier: ToolTier.CLIENT,
    keywords: [
      "toml",
      "validate",
      "syntax",
      "check",
      "lint",
      "config",
      "error",
      "parse",
      "verify",
    ],
    examples: [
      {
        title: "Valid Cargo.toml",
        description: "Validate a well-formed Cargo.toml — returns valid: true",
        input: '[package]\nname = "my-app"\nversion = "1.0.0"',
        output: '{\n  "valid": true\n}',
      },
      {
        title: "Catch unclosed section header",
        description:
          "Detect a missing closing bracket in a table header — reports the exact error position",
        input: '[package\nname = "my-app"',
        output: '{\n  "valid": false,\n  "error": "Unexpected character..."\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
