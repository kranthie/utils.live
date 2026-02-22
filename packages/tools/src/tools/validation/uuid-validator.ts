import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("UUID to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const uuidValidator = defineTool({
  meta: {
    id: "validation/uuid-validator",
    name: "UUID Validator",
    description:
      "Free online UUID validator — check if a UUID is properly formatted and identify its version instantly in your browser. No data is stored. Validates the 8-4-4-4-12 hex format per RFC 4122 for versions 1 through 7.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "uuid",
      "guid",
      "validate",
      "format",
      "rfc4122",
      "unique",
      "identifier",
      "version",
    ],
    examples: [
      {
        title: "Valid UUID v4",
        description: "Validate a UUID version 4 (random)",
        input: "550e8400-e29b-41d4-a716-446655440000",
        output: "Valid UUID v4: 550e8400-e29b-41d4-a716-446655440000",
      },
      {
        title: "Invalid UUID",
        description: "Detect an incorrectly formatted UUID",
        input: "not-a-valid-uuid-format",
        output: "Invalid UUID: Invalid characters or length",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const uuid = input.input.trim().toLowerCase();
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-([1-7])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const match = re.exec(uuid);
    if (match) {
      const version = match[1];
      return { output: `Valid UUID v${version}: ${uuid}`, isValid: true };
    }
    // Check nil UUID
    if (uuid === "00000000-0000-0000-0000-000000000000") {
      return { output: `Valid nil UUID: ${uuid}`, isValid: true };
    }
    const errors: string[] = [];
    if (!/^[0-9a-f-]{36}$/.test(uuid))
      errors.push("Invalid characters or length");
    else if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        uuid
      )
    ) {
      errors.push("Invalid format (expected 8-4-4-4-12)");
    } else {
      errors.push("Invalid version or variant bits");
    }
    return {
      output: `Invalid UUID: ${errors.join("; ")}`,
      isValid: false,
      errors,
    };
  },
});
