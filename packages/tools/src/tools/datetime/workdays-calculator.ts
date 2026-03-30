import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("Start date"),
  input2: z.string().describe("End date"),
});

const optionsSchema = z.object({
  excludeWeekends: z
    .boolean()
    .default(true)
    .describe("Exclude Saturdays and Sundays"),
});

const outputSchema = z.object({
  output: z.string().describe("Business days calculation result"),
  original: z.string().describe("Start date"),
  modified: z.string().describe("End date"),
  businessDays: z.number().describe("Number of business days"),
  totalDays: z.number().describe("Total calendar days"),
  weekends: z.number().describe("Weekend days"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const date1 = new Date(input.input1.trim());
  const date2 = new Date(input.input2.trim());

  if (isNaN(date1.getTime())) throw new Error("Unable to parse start date");
  if (isNaN(date2.getTime())) throw new Error("Unable to parse end date");

  const start = date1 < date2 ? date1 : date2;
  const end = date1 < date2 ? date2 : date1;

  let businessDays = 0;
  let weekends = 0;
  const totalDays =
    Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  const excludeWeekends = options?.excludeWeekends ?? true;

  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day === 0 || day === 6) {
      weekends++;
    } else {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  const result = excludeWeekends ? businessDays : totalDays;

  const lines: string[] = [];
  lines.push(`From: ${start.toISOString().split("T")[0]}`);
  lines.push(`To:   ${end.toISOString().split("T")[0]}`);
  lines.push("");
  lines.push(`Business days: ${businessDays}`);
  lines.push(`Weekend days:  ${weekends}`);
  lines.push(`Total days:    ${totalDays}`);
  lines.push(
    `Result:        ${result} ${excludeWeekends ? "business" : "calendar"} days`
  );

  return {
    output: lines.join("\n"),
    original: start.toISOString(),
    modified: end.toISOString(),
    businessDays,
    totalDays,
    weekends,
  };
}

export const workdaysCalculator = defineTool({
  meta: {
    id: "datetime/workdays-calculator",
    name: "Workdays Calculator",
    description:
      "Free online workdays calculator — count business days between two dates instantly in your browser. No data is stored. Excludes weekends and shows total calendar days breakdown.",
    category: "datetime",
    subgroup: "Date Calculation",
    tier: ToolTier.CLIENT,
    keywords: ["business", "workdays", "working", "days", "calculate"],
    examples: [
      {
        title: "Business Days in Q1",
        description: "Calculate business days in the first quarter of 2024",
        input: { input1: "2025-01-01", input2: "2025-03-31" },
        output:
          "From: 2025-01-01\nTo:   2025-03-31\n\nBusiness days: 64\nWeekend days:  26\nTotal days:    90\nResult:        64 business days",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
