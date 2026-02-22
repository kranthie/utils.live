import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string"),
});

const outputSchema = z.object({
  output: z.string().describe("ISO week number information"),
  weekNumber: z.number().describe("ISO week number"),
  weekYear: z.number().describe("ISO week year"),
  dayOfWeek: z.number().describe("Day of week (1=Monday, 7=Sunday)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { year: d.getUTCFullYear(), week };
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

  const { year, week } = getISOWeek(date);
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
  const DAYS = [
    "",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const lines: string[] = [];
  lines.push(`Date: ${date.toISOString().split("T")[0]}`);
  lines.push(`ISO Week: ${year}-W${String(week).padStart(2, "0")}`);
  lines.push(`Week Number: ${week}`);
  lines.push(`Week Year: ${year}`);
  lines.push(`Day of Week: ${DAYS[dayOfWeek]} (${dayOfWeek})`);

  return {
    output: lines.join("\n"),
    weekNumber: week,
    weekYear: year,
    dayOfWeek,
  };
}

export const weekNumber = defineTool({
  meta: {
    id: "datetime/week-number",
    name: "Week Number",
    description:
      "Free online week number calculator — get the ISO week number for any date instantly in your browser. No data is stored. Shows ISO week year, week number, and day of week.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["week", "number", "iso", "date", "calendar"],
    examples: [
      {
        title: "Get ISO Week Number",
        description: "Find the ISO week number for a specific date",
        input: "2025-03-15",
        output:
          "Date: 2025-03-15\nISO Week: 2025-W11\nWeek Number: 11\nWeek Year: 2025\nDay of Week: Friday (5)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
