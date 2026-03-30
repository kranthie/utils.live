import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Timestamp or date string to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Multiple epoch format conversions"),
  seconds: z.number().describe("Unix epoch (seconds)"),
  milliseconds: z.number().describe("Unix epoch (milliseconds)"),
  microseconds: z.string().describe("Unix epoch (microseconds)"),
  nanoseconds: z.string().describe("Unix epoch (nanoseconds)"),
  excelSerial: z.number().describe("Excel serial date"),
  julianDay: z.number().describe("Julian Day Number"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const num = Number(str);
  let date: Date;
  if (!isNaN(num)) {
    if (num < 4102444800) {
      date = new Date(num * 1000);
    } else if (num < 4102444800000) {
      date = new Date(num);
    } else {
      date = new Date(num / 1000); // microseconds
    }
  } else {
    date = new Date(str);
  }

  if (isNaN(date.getTime())) {
    throw new Error("Unable to parse input");
  }

  const ms = date.getTime();
  const seconds = Math.floor(ms / 1000);
  const microseconds = String(BigInt(ms) * 1000n);
  const nanoseconds = String(BigInt(ms) * 1000000n);

  // Excel serial date: days since 1900-01-01 (with Excel's leap year bug)
  // Use Date.UTC to keep the epoch in UTC and avoid a fractional-day shift
  // in non-UTC timezones (e.g. PDT would shift by 7/24 ≈ 0.292 days).
  const excelEpoch = Date.UTC(1899, 11, 30);
  const excelSerial = (ms - excelEpoch) / 86400000;

  // Julian Day Number
  const a = Math.floor((14 - (date.getUTCMonth() + 1)) / 12);
  const y = date.getUTCFullYear() + 4800 - a;
  const m = date.getUTCMonth() + 1 + 12 * a - 3;
  const julianDay =
    date.getUTCDate() +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045 +
    (date.getUTCHours() - 12) / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;

  const lines: string[] = [];
  lines.push(`Epoch Conversions for: ${date.toISOString()}`);
  lines.push("");
  lines.push(`Seconds:      ${seconds}`);
  lines.push(`Milliseconds: ${ms}`);
  lines.push(`Microseconds: ${microseconds}`);
  lines.push(`Nanoseconds:  ${nanoseconds}`);
  lines.push(`Excel Serial: ${excelSerial.toFixed(6)}`);
  lines.push(`Julian Day:   ${julianDay.toFixed(6)}`);

  return {
    output: lines.join("\n"),
    seconds,
    milliseconds: ms,
    microseconds,
    nanoseconds,
    excelSerial: Math.round(excelSerial * 1000000) / 1000000,
    julianDay: Math.round(julianDay * 1000000) / 1000000,
  };
}

export const epochConverter = defineTool({
  meta: {
    id: "datetime/epoch-converter",
    name: "Epoch Converter",
    description:
      "Free online epoch converter — convert between Unix seconds, milliseconds, microseconds, and nanoseconds instantly in your browser. No data is stored. Also shows Excel serial and Julian Day.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["epoch", "timestamp", "convert", "unix", "time"],
    examples: [
      {
        title: "Convert ISO Date to Epoch",
        description: "Convert an ISO date to various epoch formats",
        input: "2025-01-01T00:00:00Z",
        output:
          "Epoch Conversions for: 2025-01-01T00:00:00.000Z\n\nSeconds:      1735689600\nMilliseconds: 1735689600000\nMicroseconds: 1735689600000000\nNanoseconds:  1735689600000000000\nExcel Serial: 45658.000000\nJulian Day:   2460676.500000",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
