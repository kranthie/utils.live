import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date/time string to convert"),
});

const optionsSchema = z.object({
  fromTimezone: z
    .string()
    .default("UTC")
    .describe("Source timezone (IANA name, e.g., America/New_York)"),
  toTimezone: z
    .string()
    .default("America/New_York")
    .describe("Target timezone"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted time"),
  from: z.string().describe("Time in source timezone"),
  to: z.string().describe("Time in target timezone"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function formatInTimezone(date: Date, tz: string): string {
  try {
    return date.toLocaleString("en-US", {
      timeZone: tz,
      dateStyle: "full",
      timeStyle: "long",
    });
  } catch {
    throw new Error(`Invalid timezone: ${tz}`);
  }
}

function execute(input: Input, options?: Options): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const fromTz = options?.fromTimezone ?? "UTC";
  const toTz = options?.toTimezone ?? "America/New_York";

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

  const fromStr = formatInTimezone(date, fromTz);
  const toStr = formatInTimezone(date, toTz);

  const lines: string[] = [];
  lines.push(`From (${fromTz}): ${fromStr}`);
  lines.push(`To (${toTz}):     ${toStr}`);

  return { output: lines.join("\n"), from: fromStr, to: toStr };
}

export const timezoneConverter = defineTool({
  meta: {
    id: "datetime/timezone-converter",
    name: "Timezone Converter",
    description:
      "Free online timezone converter — convert dates and times between IANA timezones instantly in your browser. No data is stored. Supports all major world timezones with full date formatting.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["timezone", "convert", "time", "zone", "iana"],
    examples: [
      {
        title: "UTC to New York",
        description: "Convert a UTC time to America/New_York timezone",
        input: "2025-03-15T14:00:00Z",
        output:
          "From (UTC): Saturday, March 15, 2025 at 2:00:00 PM UTC\nTo (America/New_York):     Saturday, March 15, 2025 at 10:00:00 AM EDT",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
