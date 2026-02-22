import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string to parse"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed date information"),
  valid: z.boolean().describe("Whether the date string was parseable"),
  iso: z.string().optional().describe("ISO 8601 format"),
  timestamp: z.number().optional().describe("Unix timestamp"),
  year: z.number().optional(),
  month: z.number().optional(),
  day: z.number().optional(),
  hours: z.number().optional(),
  minutes: z.number().optional(),
  seconds: z.number().optional(),
  dayOfWeek: z.string().optional(),
});

type Input = z.infer<typeof inputSchema>;
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

function execute(input: Input): Output {
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
    return {
      output: `Unable to parse "${str}" as a date`,
      valid: false,
    };
  }

  const lines: string[] = [];
  lines.push(`Parsed Date: ${date.toISOString()}`);
  lines.push(`Year:        ${date.getFullYear()}`);
  lines.push(`Month:       ${date.getMonth() + 1}`);
  lines.push(`Day:         ${date.getDate()}`);
  lines.push(`Day of Week: ${DAYS[date.getDay()]}`);
  lines.push(`Hours:       ${date.getHours()}`);
  lines.push(`Minutes:     ${date.getMinutes()}`);
  lines.push(`Seconds:     ${date.getSeconds()}`);
  lines.push(`Timestamp:   ${Math.floor(date.getTime() / 1000)}`);

  return {
    output: lines.join("\n"),
    valid: true,
    iso: date.toISOString(),
    timestamp: Math.floor(date.getTime() / 1000),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    dayOfWeek: DAYS[date.getDay()],
  };
}

export const dateParser = defineTool({
  meta: {
    id: "datetime/date-parser",
    name: "Date Parser",
    description:
      "Free online date parser — parse any date string format into year, month, day, and time components instantly in your browser. No data is stored. Handles ISO 8601, timestamps, and natural formats.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["date", "parse", "extract", "components", "string"],
    examples: [
      {
        title: "Parse ISO Date String",
        description: "Parse an ISO 8601 date string into its components",
        input: "2025-03-15T14:30:00Z",
        output:
          "Parsed Date: 2025-03-15T14:30:00.000Z\nYear:        2025\nMonth:       3\nDay:         15\nDay of Week: Saturday\nHours:       7\nMinutes:     30\nSeconds:     0\nTimestamp:   1742049000",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
