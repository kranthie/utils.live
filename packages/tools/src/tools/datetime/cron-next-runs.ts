import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Cron expression (5 fields)"),
});

const optionsSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe("Number of next runs to show"),
});

const outputSchema = z.object({
  output: z.string().describe("Next execution times"),
  nextRuns: z.array(z.string()).describe("Array of ISO date strings"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function parseField(field: string, min: number, max: number): Set<number> {
  const values = new Set<number>();

  for (const part of field.split(",")) {
    if (part === "*") {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (part.includes("/")) {
      const [base, stepStr] = part.split("/");
      const step = parseInt(stepStr!, 10);
      const start = base === "*" ? min : parseInt(base!, 10);
      for (let i = start; i <= max; i += step) values.add(i);
    } else if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr!, 10);
      const end = parseInt(endStr!, 10);
      for (let i = start; i <= end; i++) values.add(i);
    } else {
      values.add(parseInt(part, 10));
    }
  }

  return values;
}

function execute(input: Input, options?: Options): Output {
  const expr = input.input.trim();
  const count = options?.count ?? 10;

  const fields = expr.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const minutes = parseField(fields[0]!, 0, 59);
  const hours = parseField(fields[1]!, 0, 23);
  const daysOfMonth = parseField(fields[2]!, 1, 31);
  const months = parseField(fields[3]!, 1, 12);
  const daysOfWeek = parseField(fields[4]!, 0, 7);
  // 7 is an alias for Sunday (0) used by some cron implementations
  if (daysOfWeek.has(7)) daysOfWeek.add(0);

  const results: string[] = [];
  const current = new Date();
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1);

  const maxIterations = 525960; // Max ~1 year of minutes
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    const m = current.getMonth() + 1;
    const dom = current.getDate();
    const dow = current.getDay();
    const h = current.getHours();
    const min = current.getMinutes();

    if (
      months.has(m) &&
      daysOfMonth.has(dom) &&
      daysOfWeek.has(dow) &&
      hours.has(h) &&
      minutes.has(min)
    ) {
      results.push(current.toISOString());
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  const lines: string[] = [];
  lines.push(`Cron: ${expr}`);
  lines.push(`Next ${results.length} execution times:`);
  lines.push("");
  results.forEach((r, i) => {
    const d = new Date(r);
    lines.push(
      `  ${i + 1}. ${d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`
    );
  });

  if (results.length === 0) {
    lines.push("  No execution times found within the next year.");
  }

  return { output: lines.join("\n"), nextRuns: results };
}

export const cronNextRuns = defineTool({
  meta: {
    id: "datetime/cron-next-runs",
    name: "Cron Next Runs",
    description:
      "Free online cron next runs calculator — preview upcoming execution times for any cron expression instantly in your browser. No data is stored. Shows next N scheduled runs with dates.",
    category: "datetime",
    subgroup: "Cron & Scheduling",
    tier: ToolTier.CLIENT,
    keywords: ["cron", "next", "run", "schedule", "execution"],
    examples: [
      {
        title: "Hourly Job Next Runs",
        description: "Show next 5 execution times for an hourly cron job",
        input: "0 * * * *",
        output: "(Next run times — varies based on current date and time)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
