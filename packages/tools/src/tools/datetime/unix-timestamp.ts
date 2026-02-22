import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Unix timestamp (seconds or ms) or date string to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Conversion result"),
  timestamp: z.number().describe("Unix timestamp in seconds"),
  timestampMs: z.number().describe("Unix timestamp in milliseconds"),
  iso: z.string().describe("ISO 8601 string"),
  utc: z.string().describe("UTC string"),
  local: z.string().describe("Local date string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  let date: Date;

  // Try to parse as number (Unix timestamp)
  const num = Number(str);
  if (!isNaN(num)) {
    // If number is small enough to be seconds (before year 2100 in seconds)
    if (num < 4102444800) {
      date = new Date(num * 1000);
    } else {
      date = new Date(num);
    }
  } else {
    // Try to parse as date string
    date = new Date(str);
  }

  if (isNaN(date.getTime())) {
    throw new Error("Unable to parse input as timestamp or date string");
  }

  const timestamp = Math.floor(date.getTime() / 1000);
  const timestampMs = date.getTime();
  const iso = date.toISOString();
  const utc = date.toUTCString();
  const local = date.toString();

  const lines: string[] = [];
  lines.push(`Unix Timestamp (s):  ${timestamp}`);
  lines.push(`Unix Timestamp (ms): ${timestampMs}`);
  lines.push(`ISO 8601:            ${iso}`);
  lines.push(`UTC:                 ${utc}`);
  lines.push(`Local:               ${local}`);

  return { output: lines.join("\n"), timestamp, timestampMs, iso, utc, local };
}

export const unixTimestamp = defineTool({
  meta: {
    id: "datetime/unix-timestamp",
    name: "Unix Timestamp Converter",
    description:
      "Free online Unix timestamp converter — convert between Unix timestamps and human-readable dates instantly in your browser. No data is stored. Supports seconds and milliseconds, shows ISO 8601 and UTC formats.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["unix", "timestamp", "epoch", "date", "convert", "time"],
    examples: [
      {
        title: "Unix Timestamp to Date",
        description: "Convert a Unix timestamp to a human-readable date",
        input: "1735689600",
        output:
          "Unix Timestamp (s):  1735689600\nUnix Timestamp (ms): 1735689600000\nISO 8601:            2025-01-01T00:00:00.000Z\nUTC:                 Wed, 01 Jan 2025 00:00:00 GMT\nLocal:               Tue Dec 31 2024 16:00:00 GMT-0800 (Pacific Standard Time)",
      },
      {
        title: "Date to Unix Timestamp",
        description: "Convert an ISO date string to a Unix timestamp",
        input: "2025-07-04T12:00:00Z",
        output:
          "Unix Timestamp (s):  1751630400\nUnix Timestamp (ms): 1751630400000\nISO 8601:            2025-07-04T12:00:00.000Z\nUTC:                 Fri, 04 Jul 2025 12:00:00 GMT\nLocal:               Fri Jul 04 2025 05:00:00 GMT-0700 (Pacific Daylight Time)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
