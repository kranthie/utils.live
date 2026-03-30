import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Hex color code to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const hexColorValidator = defineTool({
  meta: {
    id: "validation/hex-color-validator",
    name: "Hex Color Validator",
    description:
      "Free online hex color validator — check if a hex color code is valid instantly in your browser. No data is stored. Supports 3-digit, 4-digit (with alpha), 6-digit, and 8-digit (with alpha) hex formats — the # prefix is required.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "hex",
      "color",
      "validate",
      "css",
      "rgb",
      "web",
      "code",
      "design",
    ],
    examples: [
      {
        title: "Valid 6-Digit Hex",
        description: "Validate a standard 6-digit hex color code",
        input: "#FF5733",
        output: "Valid hex color (6-digit): #FF5733",
      },
      {
        title: "Invalid Hex Color",
        description: "Detect a hex color with invalid characters",
        input: "#GGHHII",
        output:
          "Invalid hex color: Invalid hex digits or length (expected 3, 4, 6, or 8 hex digits after #)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const color = input.input.trim();
    const re3 = /^#[0-9a-fA-F]{3}$/;
    const re4 = /^#[0-9a-fA-F]{4}$/;
    const re6 = /^#[0-9a-fA-F]{6}$/;
    const re8 = /^#[0-9a-fA-F]{8}$/;
    if (re6.test(color))
      return { output: `Valid hex color (6-digit): ${color}`, isValid: true };
    if (re3.test(color))
      return {
        output: `Valid hex color (3-digit shorthand): ${color}`,
        isValid: true,
      };
    if (re8.test(color))
      return {
        output: `Valid hex color (8-digit with alpha): ${color}`,
        isValid: true,
      };
    if (re4.test(color))
      return {
        output: `Valid hex color (4-digit shorthand with alpha): ${color}`,
        isValid: true,
      };
    const errors: string[] = [];
    if (!color.startsWith("#")) errors.push("Must start with #");
    else
      errors.push(
        "Invalid hex digits or length (expected 3, 4, 6, or 8 hex digits after #)"
      );
    return {
      output: `Invalid hex color: ${errors.join("; ")}`,
      isValid: false,
      errors,
    };
  },
});
