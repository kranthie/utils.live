import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Base date string"),
});

const optionsSchema = z.object({
  operation: z
    .enum(["add", "subtract"])
    .default("add")
    .describe("Add or subtract"),
  years: z.number().default(0).describe("Years to add/subtract"),
  months: z.number().default(0).describe("Months to add/subtract"),
  weeks: z.number().default(0).describe("Weeks to add/subtract"),
  days: z.number().default(0).describe("Days to add/subtract"),
  hours: z.number().default(0).describe("Hours to add/subtract"),
  minutes: z.number().default(0).describe("Minutes to add/subtract"),
  seconds: z.number().default(0).describe("Seconds to add/subtract"),
});

const outputSchema = z.object({
  output: z.string().describe("Resulting date"),
  original: z.string().describe("Original date"),
  result: z.string().describe("Result ISO string"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const num = Number(str);
  let date: Date;
  if (!isNaN(num)) {
    date = num < 4102444800 ? new Date(num * 1000) : new Date(num);
  } else {
    date = new Date(str);
  }

  if (isNaN(date.getTime())) {
    throw new Error("Unable to parse input as a date");
  }

  const multiplier = (options?.operation ?? "add") === "subtract" ? -1 : 1;
  const result = new Date(date);

  if (options?.years)
    result.setFullYear(result.getFullYear() + options.years * multiplier);
  if (options?.months)
    result.setMonth(result.getMonth() + options.months * multiplier);
  if (options?.weeks)
    result.setDate(result.getDate() + options.weeks * 7 * multiplier);
  if (options?.days)
    result.setDate(result.getDate() + options.days * multiplier);
  if (options?.hours)
    result.setHours(result.getHours() + options.hours * multiplier);
  if (options?.minutes)
    result.setMinutes(result.getMinutes() + options.minutes * multiplier);
  if (options?.seconds)
    result.setSeconds(result.getSeconds() + options.seconds * multiplier);

  const lines: string[] = [];
  lines.push(`Original: ${date.toISOString()}`);
  lines.push(`Result:   ${result.toISOString()}`);

  return {
    output: lines.join("\n"),
    original: date.toISOString(),
    result: result.toISOString(),
  };
}

export const dateAddSubtract = defineTool({
  meta: {
    id: "datetime/date-add-subtract",
    name: "Date Add/Subtract",
    description:
      "Free online date add/subtract tool — add or subtract days, months, and years from any date instantly in your browser. No data is stored. Supports hours, minutes, seconds, and weeks.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["date", "add", "subtract", "calculate", "offset"],
    examples: [
      {
        title: "Parse Date for Add/Subtract",
        description:
          "Parse a date (with default add-0 options, returns same date)",
        input: "2025-01-15T00:00:00Z",
        output:
          "Original: 2025-01-15T00:00:00.000Z\nResult:   2025-01-15T00:00:00.000Z",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
