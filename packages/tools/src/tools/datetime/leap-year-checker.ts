import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Year number or date string"),
});

const outputSchema = z.object({
  output: z.string().describe("Leap year check result"),
  isLeapYear: z.boolean().describe("Whether the year is a leap year"),
  year: z.number().describe("The year checked"),
  daysInYear: z.number().describe("Number of days in the year"),
  daysInFeb: z.number().describe("Number of days in February"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  let year: number;
  const num = Number(str);
  if (!isNaN(num) && Number.isInteger(num) && num > 0 && num < 10000) {
    year = num;
  } else {
    const date = new Date(str);
    if (isNaN(date.getTime()))
      throw new Error("Unable to parse input as year or date");
    year = date.getFullYear();
  }

  const leap = isLeapYear(year);
  const daysInYear = leap ? 366 : 365;
  const daysInFeb = leap ? 29 : 28;

  const lines: string[] = [];
  lines.push(`Year ${year}: ${leap ? "IS a leap year" : "is NOT a leap year"}`);
  lines.push(`Days in year: ${daysInYear}`);
  lines.push(`Days in February: ${daysInFeb}`);
  lines.push("");
  lines.push(
    "Rule: Divisible by 4, except centuries unless also divisible by 400"
  );
  lines.push(`  ${year} % 4 = ${year % 4}`);
  lines.push(`  ${year} % 100 = ${year % 100}`);
  lines.push(`  ${year} % 400 = ${year % 400}`);

  // Show nearby leap years
  const nearby: number[] = [];
  for (let y = year - 8; y <= year + 8; y++) {
    if (isLeapYear(y)) nearby.push(y);
  }
  lines.push(`\nNearby leap years: ${nearby.join(", ")}`);

  return {
    output: lines.join("\n"),
    isLeapYear: leap,
    year,
    daysInYear,
    daysInFeb,
  };
}

export const leapYearChecker = defineTool({
  meta: {
    id: "datetime/leap-year-checker",
    name: "Leap Year Checker",
    description:
      "Free online leap year checker — check if any year is a leap year with detailed explanation instantly in your browser. No data is stored. Shows divisibility rules and nearby leap years.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["leap", "year", "check", "february", "calendar"],
    examples: [
      {
        title: "Check Leap Year",
        description: "Check if 2024 is a leap year",
        input: "2024",
        output:
          "Year 2024: IS a leap year\nDays in year: 366\nDays in February: 29\n\nRule: Divisible by 4, except centuries unless also divisible by 400\n  2024 % 4 = 0\n  2024 % 100 = 24\n  2024 % 400 = 24\n\nNearby leap years: 2016, 2020, 2024, 2028, 2032",
      },
      {
        title: "Check Century Year",
        description: "Check if 1900 (a century year) is a leap year",
        input: "1900",
        output:
          "Year 1900: is NOT a leap year\nDays in year: 365\nDays in February: 28\n\nRule: Divisible by 4, except centuries unless also divisible by 400\n  1900 % 4 = 0\n  1900 % 100 = 0\n  1900 % 400 = 300\n\nNearby leap years: 1892, 1896, 1904, 1908",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
