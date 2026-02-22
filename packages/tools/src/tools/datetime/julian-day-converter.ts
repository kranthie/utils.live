import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Julian Day Number or date string"),
});

const outputSchema = z.object({
  output: z.string().describe("Conversion result"),
  julianDay: z.number().describe("Julian Day Number"),
  iso: z.string().describe("ISO date string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function dateToJulianDay(date: Date): number {
  const a = Math.floor((14 - (date.getUTCMonth() + 1)) / 12);
  const y = date.getUTCFullYear() + 4800 - a;
  const m = date.getUTCMonth() + 1 + 12 * a - 3;
  return (
    date.getUTCDate() +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function julianDayToDate(jd: number): Date {
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return new Date(Date.UTC(year, month - 1, day));
}

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const num = Number(str);

  // If it looks like a Julian Day Number (typically > 1000000)
  if (!isNaN(num) && num > 1721000 && num < 5373485) {
    const date = julianDayToDate(Math.floor(num));
    return {
      output: `Julian Day ${num} = ${date.toISOString().split("T")[0]}`,
      julianDay: num,
      iso: date.toISOString(),
    };
  }

  // Try parsing as date
  let date: Date;
  if (!isNaN(num)) {
    date = num < 4102444800 ? new Date(num * 1000) : new Date(num);
  } else {
    date = new Date(str);
  }

  if (isNaN(date.getTime())) {
    throw new Error("Unable to parse input as date or Julian Day Number");
  }

  const jd = dateToJulianDay(date);
  return {
    output: `${date.toISOString().split("T")[0]} = Julian Day ${jd}`,
    julianDay: jd,
    iso: date.toISOString(),
  };
}

export const julianDayConverter = defineTool({
  meta: {
    id: "datetime/julian-day-converter",
    name: "Julian Day Converter",
    description:
      "Free online Julian Day converter — convert between Julian Day Numbers and calendar dates instantly in your browser. No data is stored. Useful for astronomy and historical date calculations.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["julian", "day", "convert", "astronomy", "calendar"],
    examples: [
      {
        title: "Date to Julian Day",
        description: "Convert a calendar date to its Julian Day Number",
        input: "2025-01-01",
        output: "2025-01-01 = Julian Day 2460677",
      },
      {
        title: "Julian Day to Date",
        description: "Convert a Julian Day Number back to a calendar date",
        input: "2460676",
        output: "Julian Day 2460676 = 2024-12-31",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
