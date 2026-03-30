import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  startDate: z.string().default("2024-01-01").describe("Start date"),
  endDate: z.string().default("2024-01-31").describe("End date"),
  step: z
    .enum(["day", "week", "month"])
    .default("day")
    .describe("Step interval"),
  format: z
    .enum(["iso", "short", "long"])
    .default("iso")
    .describe("Output date format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated date range"),
  count: z.number().describe("Number of dates generated"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

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
const DAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatDateValue(date: Date, format: string): string {
  switch (format) {
    case "short":
      return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
    case "long":
      return `${DAYS_LONG[date.getUTCDay()]}, ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
    default:
      return date.toISOString().split("T")[0]!;
  }
}

function execute(input: Input): Output {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  if (isNaN(start.getTime())) throw new Error("Invalid start date");
  if (isNaN(end.getTime())) throw new Error("Invalid end date");
  if (start > end) throw new Error("Start date must be before end date");

  const dates: string[] = [];
  const current = new Date(start);
  const maxDates = 1000;

  while (current <= end && dates.length < maxDates) {
    dates.push(formatDateValue(current, input.format));

    switch (input.step) {
      case "day":
        current.setUTCDate(current.getUTCDate() + 1);
        break;
      case "week":
        current.setUTCDate(current.getUTCDate() + 7);
        break;
      case "month":
        current.setUTCMonth(current.getUTCMonth() + 1);
        break;
    }
  }

  return {
    output: dates.join("\n"),
    count: dates.length,
  };
}

export const dateRangeGenerator = defineTool({
  meta: {
    id: "datetime/date-range-generator",
    name: "Date Range Generator",
    description:
      "Free online date range generator — create a sequence of dates between start and end dates instantly in your browser. No data is stored. Supports daily, weekly, and monthly intervals.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["date", "range", "sequence", "generate", "series"],
    examples: [
      {
        title: "Weekly Dates in Q1",
        description: "Generate weekly dates for the first quarter of 2025",
        input: {
          startDate: "2025-01-01",
          endDate: "2025-03-31",
          step: "week",
          format: "iso",
        },
        output:
          "2025-01-01\n2025-01-08\n2025-01-15\n2025-01-22\n2025-01-29\n2025-02-05\n2025-02-12\n2025-02-19\n2025-02-26\n2025-03-05\n2025-03-11\n2025-03-18\n2025-03-25",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
