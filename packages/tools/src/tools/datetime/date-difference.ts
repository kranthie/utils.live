import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("Start date"),
  input2: z.string().describe("End date"),
});

const outputSchema = z.object({
  output: z.string().describe("Difference summary"),
  original: z.string().describe("Start date"),
  modified: z.string().describe("End date"),
  days: z.number().describe("Difference in days"),
  weeks: z.number().describe("Difference in weeks"),
  months: z.number().describe("Approximate months"),
  years: z.number().describe("Approximate years"),
  hours: z.number().describe("Difference in hours"),
  minutes: z.number().describe("Difference in minutes"),
  seconds: z.number().describe("Difference in seconds"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function parseDate(str: string): Date {
  const num = Number(str);
  if (!isNaN(num)) {
    return num < 4102444800 ? new Date(num * 1000) : new Date(num);
  }
  return new Date(str);
}

function execute(input: Input): Output {
  const date1 = parseDate(input.input1.trim());
  const date2 = parseDate(input.input2.trim());

  if (isNaN(date1.getTime())) throw new Error("Unable to parse start date");
  if (isNaN(date2.getTime())) throw new Error("Unable to parse end date");

  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.round((days / 30.44) * 100) / 100;
  const years = Math.round((days / 365.25) * 100) / 100;

  const lines: string[] = [];
  lines.push(`From: ${date1.toISOString()}`);
  lines.push(`To:   ${date2.toISOString()}`);
  lines.push("");
  lines.push(`Difference:`);
  lines.push(`  ${years} years`);
  lines.push(`  ${months} months`);
  lines.push(`  ${weeks} weeks`);
  lines.push(`  ${days} days`);
  lines.push(`  ${hours} hours`);
  lines.push(`  ${minutes} minutes`);
  lines.push(`  ${seconds} seconds`);

  return {
    output: lines.join("\n"),
    original: date1.toISOString(),
    modified: date2.toISOString(),
    days,
    weeks,
    months,
    years,
    hours,
    minutes,
    seconds,
  };
}

export const dateDifference = defineTool({
  meta: {
    id: "datetime/date-difference",
    name: "Date Difference",
    description:
      "Free online date difference calculator — compute the gap between two dates in years, months, weeks, and days instantly in your browser. No data is stored. Also shows hours, minutes, and seconds.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["date", "difference", "between", "days", "calculate"],
    examples: [
      {
        title: "Days Between Dates",
        description: "Calculate the difference between two project milestones",
        input: { input1: "2025-01-15", input2: "2025-06-30" },
        output:
          "From: 2025-01-15T00:00:00.000Z\nTo:   2025-06-30T00:00:00.000Z\n\nDifference:\n  0.45 years\n  5.45 months\n  23 weeks\n  166 days\n  3984 hours\n  239040 minutes\n  14342400 seconds",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
