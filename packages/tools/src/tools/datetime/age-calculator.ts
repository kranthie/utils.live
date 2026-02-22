import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  birthdate: z
    .string()
    .default("1990-01-01")
    .describe("Birth date (YYYY-MM-DD)"),
  referenceDate: z
    .string()
    .default("")
    .describe("Reference date (default: today)"),
});

const outputSchema = z.object({
  output: z.string().describe("Age calculation result"),
  years: z.number().describe("Years"),
  months: z.number().describe("Remaining months"),
  days: z.number().describe("Remaining days"),
  totalDays: z.number().describe("Total days alive"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const birth = new Date(input.birthdate);
  if (isNaN(birth.getTime())) throw new Error("Invalid birthdate");

  const ref = input.referenceDate ? new Date(input.referenceDate) : new Date();
  if (isNaN(ref.getTime())) throw new Error("Invalid reference date");

  if (birth > ref) throw new Error("Birthdate cannot be in the future");

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalDays = Math.floor((ref.getTime() - birth.getTime()) / 86400000);

  const lines: string[] = [];
  lines.push(`Age: ${years} years, ${months} months, ${days} days`);
  lines.push(`Total days: ${totalDays.toLocaleString()}`);
  lines.push(`Total weeks: ${Math.floor(totalDays / 7).toLocaleString()}`);
  lines.push(`Total hours: ${(totalDays * 24).toLocaleString()}`);
  lines.push("");
  lines.push(`Born: ${birth.toISOString().split("T")[0]}`);
  lines.push(`As of: ${ref.toISOString().split("T")[0]}`);

  // Next birthday
  const nextBday = new Date(
    ref.getFullYear(),
    birth.getMonth(),
    birth.getDate()
  );
  if (nextBday <= ref) {
    nextBday.setFullYear(nextBday.getFullYear() + 1);
  }
  const daysToNext = Math.ceil((nextBday.getTime() - ref.getTime()) / 86400000);
  lines.push(
    `\nNext birthday in ${daysToNext} days (${nextBday.toISOString().split("T")[0]})`
  );

  return { output: lines.join("\n"), years, months, days, totalDays };
}

export const ageCalculator = defineTool({
  meta: {
    id: "datetime/age-calculator",
    name: "Age Calculator",
    description:
      "Free online age calculator — compute exact age from birthdate instantly in your browser. No data is stored. Shows years, months, days, total days, and next birthday.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["age", "birthday", "calculate", "years", "born"],
    examples: [
      {
        title: "Calculate Age",
        description:
          "Calculate age from a specific birthdate to a reference date",
        input: { birthdate: "1990-06-15", referenceDate: "2025-03-20" },
        output:
          "Age: 34 years, 9 months, 5 days\nTotal days: 12,697\nTotal weeks: 1,813\nTotal hours: 304,728\n\nBorn: 1990-06-15\nAs of: 2025-03-20\n\nNext birthday in 87 days (2025-06-14)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
