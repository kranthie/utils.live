import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string"),
});

const outputSchema = z.object({
  output: z.string().describe("Quarter information"),
  quarter: z.number().describe("Quarter number (1-4)"),
  year: z.number().describe("Year"),
  quarterStart: z.string().describe("Quarter start date"),
  quarterEnd: z.string().describe("Quarter end date"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

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

  const month = date.getUTCMonth();
  const quarter = Math.floor(month / 3) + 1;
  const year = date.getUTCFullYear();

  const startMonth = (quarter - 1) * 3;
  const quarterStart = new Date(Date.UTC(year, startMonth, 1));
  const quarterEnd = new Date(Date.UTC(year, startMonth + 3, 0));

  const lines: string[] = [];
  lines.push(`Date: ${date.toISOString().split("T")[0]}`);
  lines.push(`Quarter: Q${quarter} ${year}`);
  lines.push(`Start: ${quarterStart.toISOString().split("T")[0]}`);
  lines.push(`End: ${quarterEnd.toISOString().split("T")[0]}`);

  return {
    output: lines.join("\n"),
    quarter,
    year,
    quarterStart: quarterStart.toISOString().split("T")[0]!,
    quarterEnd: quarterEnd.toISOString().split("T")[0]!,
  };
}

export const quarterCalculator = defineTool({
  meta: {
    id: "datetime/quarter-calculator",
    name: "Quarter Calculator",
    description:
      "Free online quarter calculator — determine the fiscal quarter for any date instantly in your browser. No data is stored. Shows quarter number, start date, and end date.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["quarter", "fiscal", "date", "Q1", "Q2", "Q3", "Q4"],
    examples: [
      {
        title: "Find Quarter for Date",
        description: "Determine which fiscal quarter August 15 falls in",
        input: "2025-08-15",
        output:
          "Date: 2025-08-15\nQuarter: Q3 2025\nStart: 2025-07-01\nEnd: 2025-09-30",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
