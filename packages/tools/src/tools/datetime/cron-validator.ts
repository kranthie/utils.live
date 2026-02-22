import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Cron expression to validate"),
});

const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  valid: z.boolean().describe("Whether the cron expression is valid"),
  errors: z.array(z.string()).describe("Validation errors"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function validateField(
  field: string,
  min: number,
  max: number,
  name: string
): string[] {
  const errors: string[] = [];

  for (const part of field.split(",")) {
    if (part === "*" || part === "?") continue;

    if (part.includes("/")) {
      const [base, step] = part.split("/");
      if (base !== "*") {
        const baseNum = parseInt(base!, 10);
        if (isNaN(baseNum) || baseNum < min || baseNum > max) {
          errors.push(
            `${name}: invalid base '${base}' in step expression (must be ${min}-${max})`
          );
        }
      }
      const stepNum = parseInt(step!, 10);
      if (isNaN(stepNum) || stepNum < 1) {
        errors.push(`${name}: invalid step '${step}' (must be >= 1)`);
      }
    } else if (part.includes("-")) {
      const [start, end] = part.split("-");
      const startNum = parseInt(start!, 10);
      const endNum = parseInt(end!, 10);
      if (isNaN(startNum) || startNum < min || startNum > max) {
        errors.push(
          `${name}: invalid range start '${start}' (must be ${min}-${max})`
        );
      }
      if (isNaN(endNum) || endNum < min || endNum > max) {
        errors.push(
          `${name}: invalid range end '${end}' (must be ${min}-${max})`
        );
      }
      if (startNum > endNum) {
        errors.push(`${name}: range start (${start}) > end (${end})`);
      }
    } else {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < min || num > max) {
        errors.push(
          `${name}: value '${part}' out of range (must be ${min}-${max})`
        );
      }
    }
  }

  return errors;
}

function execute(input: Input): Output {
  const expr = input.input.trim();
  if (!expr) throw new Error("Cron expression cannot be empty");

  const fields = expr.split(/\s+/);
  const errors: string[] = [];

  if (fields.length < 5 || fields.length > 7) {
    errors.push(`Expected 5-7 fields, got ${fields.length}`);
    return {
      output: `Invalid: ${errors[0]}`,
      valid: false,
      errors,
    };
  }

  errors.push(...validateField(fields[0]!, 0, 59, "Minute"));
  errors.push(...validateField(fields[1]!, 0, 23, "Hour"));
  errors.push(...validateField(fields[2]!, 1, 31, "Day-of-month"));
  errors.push(...validateField(fields[3]!, 1, 12, "Month"));
  errors.push(...validateField(fields[4]!, 0, 7, "Day-of-week"));

  const valid = errors.length === 0;

  const lines: string[] = [];
  lines.push(`Cron: ${expr}`);
  lines.push(`Valid: ${valid ? "Yes" : "No"}`);
  if (errors.length > 0) {
    lines.push("\nErrors:");
    errors.forEach((e) => lines.push(`  - ${e}`));
  }

  return { output: lines.join("\n"), valid, errors };
}

export const cronValidator = defineTool({
  meta: {
    id: "datetime/cron-validator",
    name: "Cron Validator",
    description:
      "Free online cron validator — check cron expression syntax for errors instantly in your browser. No data is stored. Validates all five fields with range and step checks.",
    category: "datetime",
    subgroup: "Cron & Scheduling",
    tier: ToolTier.CLIENT,
    keywords: ["cron", "validate", "syntax", "check", "verify"],
    examples: [
      {
        title: "Valid Cron Expression",
        description: "Validate a correctly formed cron expression",
        input: "0 9 * * 1-5",
        output: "Cron: 0 9 * * 1-5\nValid: Yes",
      },
      {
        title: "Invalid Cron Expression",
        description: "Validate a cron expression with out-of-range values",
        input: "0 25 * * *",
        output:
          "Cron: 0 25 * * *\nValid: No\n\nErrors:\n  - Hour: value '25' out of range (must be 0-23)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
