import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string to format"),
});

const optionsSchema = z.object({
  format: z.string().default("YYYY-MM-DD HH:mm:ss").describe("Format pattern"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted date string"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(date: Date, fmt: string): string {
  const tokens: Record<string, string> = {
    YYYY: String(date.getUTCFullYear()),
    YY: String(date.getUTCFullYear()).slice(-2),
    MMMM: MONTHS[date.getUTCMonth()]!,
    MMM: MONTHS_SHORT[date.getUTCMonth()]!,
    MM: String(date.getUTCMonth() + 1).padStart(2, "0"),
    M: String(date.getUTCMonth() + 1),
    DD: String(date.getUTCDate()).padStart(2, "0"),
    D: String(date.getUTCDate()),
    dddd: DAYS[date.getUTCDay()]!,
    ddd: DAYS_SHORT[date.getUTCDay()]!,
    dd: DAYS_SHORT[date.getUTCDay()]!.substring(0, 2),
    HH: String(date.getUTCHours()).padStart(2, "0"),
    H: String(date.getUTCHours()),
    hh: String(date.getUTCHours() % 12 || 12).padStart(2, "0"),
    h: String(date.getUTCHours() % 12 || 12),
    mm: String(date.getUTCMinutes()).padStart(2, "0"),
    m: String(date.getUTCMinutes()),
    ss: String(date.getUTCSeconds()).padStart(2, "0"),
    s: String(date.getUTCSeconds()),
    SSS: String(date.getUTCMilliseconds()).padStart(3, "0"),
    A: date.getUTCHours() >= 12 ? "PM" : "AM",
    a: date.getUTCHours() >= 12 ? "pm" : "am",
    ZZ: (() => {
      const offset = -date.getTimezoneOffset();
      const sign = offset >= 0 ? "+" : "-";
      const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
      const m = String(Math.abs(offset) % 60).padStart(2, "0");
      return `${sign}${h}${m}`;
    })(),
    Z: (() => {
      const offset = -date.getTimezoneOffset();
      const sign = offset >= 0 ? "+" : "-";
      const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
      const m = String(Math.abs(offset) % 60).padStart(2, "0");
      return `${sign}${h}:${m}`;
    })(),
    X: String(Math.floor(date.getTime() / 1000)),
    x: String(date.getTime()),
  };

  // Single-pass replacement: build one regex with all tokens (longest first)
  // so token values never get re-scanned for further substitution.
  const sortedKeys = Object.keys(tokens).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    sortedKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g"
  );
  return fmt.replace(pattern, (match) => tokens[match] ?? match);
}

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

  const fmt = options?.format ?? "YYYY-MM-DD HH:mm:ss";
  return { output: formatDate(date, fmt) };
}

export const dateFormatter = defineTool({
  meta: {
    id: "datetime/date-formatter",
    name: "Date Formatter",
    description:
      "Free online date formatter — format dates using custom patterns like YYYY-MM-DD HH:mm:ss instantly in your browser. No data is stored. Supports day names, 12/24h, AM/PM, and timezone offsets.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["date", "format", "custom", "pattern", "strftime"],
    examples: [
      {
        title: "Format ISO Date",
        description: "Format a date using a custom pattern with day name",
        input: "2025-07-04T15:30:00Z",
        output: "2025-07-04 15:30:00",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
