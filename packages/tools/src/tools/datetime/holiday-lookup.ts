import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  year: z
    .number()
    .min(1900)
    .max(2100)
    .default(new Date().getFullYear())
    .describe("Year to look up holidays"),
  country: z
    .enum(["us", "international"])
    .default("us")
    .describe("Country/region"),
});

const outputSchema = z.object({
  output: z.string().describe("Holiday list"),
  holidays: z
    .array(
      z.object({
        name: z.string(),
        date: z.string(),
      })
    )
    .describe("Array of holidays"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function getNthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date {
  const first = new Date(Date.UTC(year, month, 1));
  let day = 1 + ((weekday - first.getUTCDay() + 7) % 7);
  day += (n - 1) * 7;
  return new Date(Date.UTC(year, month, day));
}

function getLastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(Date.UTC(year, month + 1, 0));
  const diff = (last.getUTCDay() - weekday + 7) % 7;
  return new Date(Date.UTC(year, month, last.getUTCDate() - diff));
}

function getUSHolidays(year: number): Array<{ name: string; date: string }> {
  const holidays: Array<{ name: string; date: Date }> = [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: "Martin Luther King Jr. Day", date: getNthWeekday(year, 0, 1, 3) },
    { name: "Presidents' Day", date: getNthWeekday(year, 1, 1, 3) },
    { name: "Memorial Day", date: getLastWeekday(year, 4, 1) },
    { name: "Juneteenth", date: new Date(year, 5, 19) },
    { name: "Independence Day", date: new Date(year, 6, 4) },
    { name: "Labor Day", date: getNthWeekday(year, 8, 1, 1) },
    { name: "Columbus Day", date: getNthWeekday(year, 9, 1, 2) },
    { name: "Veterans Day", date: new Date(year, 10, 11) },
    { name: "Thanksgiving", date: getNthWeekday(year, 10, 4, 4) },
    { name: "Christmas Day", date: new Date(year, 11, 25) },
  ];

  return holidays
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((h) => ({ name: h.name, date: h.date.toISOString().split("T")[0]! }));
}

function getInternationalHolidays(
  year: number
): Array<{ name: string; date: string }> {
  const holidays: Array<{ name: string; date: Date }> = [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: "International Women's Day", date: new Date(year, 2, 8) },
    { name: "Earth Day", date: new Date(year, 3, 22) },
    { name: "International Workers' Day", date: new Date(year, 4, 1) },
    { name: "World Environment Day", date: new Date(year, 5, 5) },
    { name: "International Day of Peace", date: new Date(year, 8, 21) },
    { name: "United Nations Day", date: new Date(year, 9, 24) },
    { name: "Human Rights Day", date: new Date(year, 11, 10) },
    { name: "Christmas Day", date: new Date(year, 11, 25) },
    { name: "New Year's Eve", date: new Date(year, 11, 31) },
  ];

  return holidays
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((h) => ({ name: h.name, date: h.date.toISOString().split("T")[0]! }));
}

function execute(input: Input): Output {
  const holidays =
    input.country === "us"
      ? getUSHolidays(input.year)
      : getInternationalHolidays(input.year);

  const lines: string[] = [];
  lines.push(
    `${input.country === "us" ? "US" : "International"} Holidays ${input.year}`
  );
  lines.push("=".repeat(40));
  for (const h of holidays) {
    const date = new Date(h.date);
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      date.getDay()
    ];
    lines.push(`${h.date} (${dayName})  ${h.name}`);
  }

  return { output: lines.join("\n"), holidays };
}

export const holidayLookup = defineTool({
  meta: {
    id: "datetime/holiday-lookup",
    name: "Holiday Lookup",
    description:
      "Free online holiday lookup — find US and international holidays for any year instantly in your browser. No data is stored. Lists federal holidays with exact dates and day-of-week.",
    category: "datetime",
    subgroup: "Calendar",
    tier: ToolTier.CLIENT,
    keywords: ["holiday", "lookup", "us", "calendar", "observance"],
    examples: [
      {
        title: "US Holidays 2025",
        description: "Look up all US federal holidays for 2025",
        input: { year: 2025, country: "us" },
        output:
          "US Holidays 2025\n========================================\n2025-01-01 (Tue)  New Year's Day\n2025-01-20 (Sun)  Martin Luther King Jr. Day\n2025-02-17 (Sun)  Presidents' Day\n2025-05-26 (Sun)  Memorial Day\n2025-06-19 (Wed)  Juneteenth\n2025-07-04 (Thu)  Independence Day\n2025-09-01 (Sun)  Labor Day\n2025-10-13 (Sun)  Columbus Day\n2025-11-11 (Mon)  Veterans Day\n2025-11-27 (Wed)  Thanksgiving\n2025-12-25 (Wed)  Christmas Day",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
