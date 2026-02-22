import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string, YYYY-MM, or month number (1-12)"),
});

const optionsSchema = z.object({
  year: z.number().default(0).describe("Year (if input is month number only)"),
});

const outputSchema = z.object({
  output: z.string().describe("Days in month result"),
  days: z.number().describe("Number of days in the month"),
  month: z.number().describe("Month number"),
  year: z.number().describe("Year"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

const MONTH_NAMES = [
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

function execute(input: Input, options?: Options): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  let month: number;
  let year: number;

  const monthNum = Number(str);
  if (
    !isNaN(monthNum) &&
    monthNum >= 1 &&
    monthNum <= 12 &&
    Number.isInteger(monthNum)
  ) {
    month = monthNum;
    year =
      options?.year && options.year > 0
        ? options.year
        : new Date().getFullYear();
  } else if (/^\d{4}-\d{1,2}$/.test(str)) {
    const parts = str.split("-");
    year = parseInt(parts[0]!, 10);
    month = parseInt(parts[1]!, 10);
  } else {
    const date = new Date(str);
    if (isNaN(date.getTime())) throw new Error("Unable to parse input");
    month = date.getMonth() + 1;
    year = date.getFullYear();
  }

  if (month < 1 || month > 12)
    throw new Error("Month must be between 1 and 12");

  // Days in month: use day 0 of next month
  const days = new Date(year, month, 0).getDate();

  return {
    output: `${MONTH_NAMES[month - 1]} ${year}: ${days} days`,
    days,
    month,
    year,
  };
}

export const daysInMonth = defineTool({
  meta: {
    id: "datetime/days-in-month",
    name: "Days in Month",
    description:
      "Free online days in month calculator — find how many days are in any month instantly in your browser. No data is stored. Handles leap years and accepts date strings or YYYY-MM format.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["days", "month", "calendar", "count"],
    examples: [
      {
        title: "February in Leap Year",
        description: "Check how many days February has in a leap year",
        input: "2024-02",
        output: "February 2024: 29 days",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
