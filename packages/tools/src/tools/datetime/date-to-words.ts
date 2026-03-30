import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string to spell out"),
});

const outputSchema = z.object({
  output: z.string().describe("Date spelled out in words"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

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
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function numberToWords(n: number): string {
  if (n === 0) return "zero";
  if (n < 20) return ONES[n]!;
  if (n < 100) {
    const ten = TENS[Math.floor(n / 10)]!;
    const one = ONES[n % 10];
    return one ? `${ten}-${one}` : ten;
  }
  if (n < 1000) {
    const hundred = `${ONES[Math.floor(n / 100)]} hundred`;
    const rem = n % 100;
    return rem ? `${hundred} and ${numberToWords(rem)}` : hundred;
  }
  if (n < 10000) {
    const thousand = `${numberToWords(Math.floor(n / 1000))} thousand`;
    const rem = n % 1000;
    return rem ? `${thousand} ${numberToWords(rem)}` : thousand;
  }
  return String(n);
}

function ordinal(n: number): string {
  const w = numberToWords(n);
  if (w.endsWith("one")) return w.slice(0, -3) + "first";
  if (w.endsWith("two")) return w.slice(0, -3) + "second";
  if (w.endsWith("three")) return w.slice(0, -5) + "third";
  if (w.endsWith("five")) return w.slice(0, -4) + "fifth";
  if (w.endsWith("eight")) return w + "h";
  if (w.endsWith("nine")) return w.slice(0, -4) + "ninth";
  if (w.endsWith("twelve")) return w.slice(0, -6) + "twelfth";
  if (w.endsWith("y")) return w.slice(0, -1) + "ieth";
  return w + "th";
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

  if (isNaN(date.getTime())) {
    throw new Error("Unable to parse input as a date");
  }

  const dayName = DAYS[date.getUTCDay()]!;
  const monthName = MONTHS[date.getUTCMonth()]!;
  const dayOrdinal = ordinal(date.getUTCDate());
  const year = numberToWords(date.getUTCFullYear());

  const lines: string[] = [];
  lines.push(`${dayName}, the ${dayOrdinal} of ${monthName}, ${year}`);
  lines.push(`${monthName} ${dayOrdinal}, ${year}`);

  return { output: lines.join("\n") };
}

export const dateToWords = defineTool({
  meta: {
    id: "datetime/date-to-words",
    name: "Date to Words",
    description:
      "Free online date to words converter — spell out any date in written English form instantly in your browser. No data is stored. Produces ordinal day names and year in words.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["date", "words", "spell", "written", "english", "ordinal"],
    examples: [
      {
        title: "Spell Out a Date",
        description: "Convert an ISO date to written English",
        input: "2025-07-04",
        output:
          "Friday, the fourth of July, two thousand twenty-five\nJuly fourth, two thousand twenty-five",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
