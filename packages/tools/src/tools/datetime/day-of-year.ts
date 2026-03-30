import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string"),
});

const outputSchema = z.object({
  output: z.string().describe("Day of year information"),
  dayOfYear: z.number().describe("Day number in the year (1-366)"),
  remaining: z.number().describe("Days remaining in the year"),
  isLeapYear: z.boolean().describe("Whether it is a leap year"),
  percentComplete: z.number().describe("Percentage of year complete"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

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

  if (isNaN(date.getTime())) throw new Error("Unable to parse date");

  const year = date.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86400000) + 1;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const remaining = daysInYear - dayOfYear;
  const percentComplete = Math.round((dayOfYear / daysInYear) * 10000) / 100;

  const lines: string[] = [];
  lines.push(`Date: ${date.toISOString().split("T")[0]}`);
  lines.push(`Day of Year: ${dayOfYear} / ${daysInYear}`);
  lines.push(`Days Remaining: ${remaining}`);
  lines.push(`Year Progress: ${percentComplete}%`);
  lines.push(`Leap Year: ${isLeapYear(year) ? "Yes" : "No"}`);

  return {
    output: lines.join("\n"),
    dayOfYear,
    remaining,
    isLeapYear: isLeapYear(year),
    percentComplete,
  };
}

export const dayOfYear = defineTool({
  meta: {
    id: "datetime/day-of-year",
    name: "Day of Year",
    description:
      "Free online day of year calculator — find the day number within the year for any date instantly in your browser. No data is stored. Shows remaining days, year progress percentage, and leap year status.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["day", "year", "ordinal", "number", "julian"],
    examples: [
      {
        title: "Day of Year for Date",
        description: "Find which day of the year March 15 is",
        input: "2025-03-15",
        output:
          "Date: 2025-03-15\nDay of Year: 74 / 365\nDays Remaining: 291\nYear Progress: 20.27%\nLeap Year: No",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
