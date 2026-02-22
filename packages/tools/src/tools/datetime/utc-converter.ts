import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date/time string to convert"),
});

const optionsSchema = z.object({
  direction: z
    .enum(["to-utc", "from-utc"])
    .default("to-utc")
    .describe("Conversion direction"),
  timezone: z
    .string()
    .default("America/New_York")
    .describe("Local timezone (IANA name)"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted time"),
  utc: z.string().describe("UTC time"),
  local: z.string().describe("Local time"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const tz = options?.timezone ?? "America/New_York";

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

  let utcStr: string;
  let localStr: string;

  try {
    utcStr = date.toLocaleString("en-US", {
      timeZone: "UTC",
      dateStyle: "full",
      timeStyle: "long",
    });
    localStr = date.toLocaleString("en-US", {
      timeZone: tz,
      dateStyle: "full",
      timeStyle: "long",
    });
  } catch {
    throw new Error(`Invalid timezone: ${tz}`);
  }

  const lines: string[] = [];
  lines.push(`UTC:                   ${utcStr}`);
  lines.push(`Local (${tz}): ${localStr}`);
  lines.push(`ISO:                   ${date.toISOString()}`);

  return { output: lines.join("\n"), utc: utcStr, local: localStr };
}

export const utcConverter = defineTool({
  meta: {
    id: "datetime/utc-converter",
    name: "UTC Converter",
    description:
      "Free online UTC converter — convert between local time and UTC instantly in your browser. No data is stored. Supports any IANA timezone with full date and time display.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["utc", "local", "convert", "timezone", "gmt"],
    examples: [
      {
        title: "Convert to UTC",
        description: "Convert a local time to UTC",
        input: "2025-03-15T10:30:00Z",
        output:
          "UTC:                   Saturday, March 15, 2025 at 10:30:00 AM UTC\nLocal (America/New_York): Saturday, March 15, 2025 at 6:30:00 AM EDT\nISO:                   2025-03-15T10:30:00.000Z",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
