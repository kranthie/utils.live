import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Cron expression to validate (e.g., '*/5 * * * *')"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

const FIELD_NAMES = [
  "minute",
  "hour",
  "day of month",
  "month",
  "day of week",
] as const;
const FIELD_RANGES: readonly [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
] as const;

function validateField(
  field: string,
  min: number,
  max: number,
  name: string
): string | null {
  if (field === "*") return null;
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2), 10);
    if (isNaN(step) || step < 1) return `${name}: invalid step value`;
    return null;
  }
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const rangeParts = part.split("-").map(Number);
      const a = rangeParts[0];
      const b = rangeParts[1];
      if (a === undefined || b === undefined || isNaN(a) || isNaN(b))
        return `${name}: invalid range`;
      if (a < min || b > max)
        return `${name}: value out of range (${min}-${max})`;
    } else if (part.includes("/")) {
      const slashParts = part.split("/");
      const stepStr = slashParts[1];
      if (!stepStr || isNaN(parseInt(stepStr, 10)))
        return `${name}: invalid step`;
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n) || n < min || n > max)
        return `${name}: value ${part} out of range (${min}-${max})`;
    }
  }
  return null;
}

export const cronValidatorTool = defineTool({
  meta: {
    id: "validation/cron-validator-tool",
    name: "Cron Validator",
    description:
      "Free online cron expression validator — verify your cron schedule syntax instantly in your browser. No data is stored. Parses minute, hour, day-of-month, month, and day-of-week fields with support for ranges, steps, and wildcards.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "cron",
      "schedule",
      "validate",
      "expression",
      "job",
      "crontab",
      "linux",
      "timer",
      "recurring",
    ],
    examples: [
      {
        title: "Every 5 Minutes",
        description: "Validate a cron expression that runs every 5 minutes",
        input: "*/5 * * * *",
        output:
          "Valid cron expression\nminute(*/5) hour(*) dom(*) month(*) dow(*)",
      },
      {
        title: "Invalid Cron",
        description: "Detect an invalid cron expression with too few fields",
        input: "*/5 * *",
        output: "Invalid cron: Expected 5 fields (or 6 with seconds), got 3",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const cron = input.input.trim();
    const parts = cron.split(/\s+/);
    const errors: string[] = [];

    if (parts.length !== 5 && parts.length !== 6) {
      errors.push(`Expected 5 fields (or 6 with seconds), got ${parts.length}`);
    } else {
      const offset = parts.length === 6 ? 1 : 0;
      if (offset === 1) {
        const secErr = validateField(parts[0] ?? "", 0, 59, "second");
        if (secErr) errors.push(secErr);
      }
      for (let i = 0; i < 5; i++) {
        const range = FIELD_RANGES[i];
        const name = FIELD_NAMES[i];
        if (!range || !name) continue;
        const err = validateField(
          parts[i + offset] ?? "",
          range[0],
          range[1],
          name
        );
        if (err) errors.push(err);
      }
    }

    const isValid = errors.length === 0;
    if (isValid) {
      const desc =
        parts.length === 5
          ? `minute(${parts[0] ?? ""}) hour(${parts[1] ?? ""}) dom(${parts[2] ?? ""}) month(${parts[3] ?? ""}) dow(${parts[4] ?? ""})`
          : `sec(${parts[0] ?? ""}) min(${parts[1] ?? ""}) hour(${parts[2] ?? ""}) dom(${parts[3] ?? ""}) month(${parts[4] ?? ""}) dow(${parts[5] ?? ""})`;
      return { output: `Valid cron expression\n${desc}`, isValid: true };
    }
    return {
      output: `Invalid cron: ${errors.join("; ")}`,
      isValid: false,
      errors,
    };
  },
});
