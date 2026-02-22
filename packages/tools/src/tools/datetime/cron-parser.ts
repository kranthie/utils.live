import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Cron expression to parse (5 or 6 fields)"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("Human-readable explanation of the cron expression"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const MONTHS = [
  "",
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
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function describeField(
  value: string,
  fieldName: string,
  names?: string[]
): string {
  if (value === "*") return `every ${fieldName}`;
  if (value.includes("/")) {
    const [base, step] = value.split("/");
    if (base === "*") return `every ${step} ${fieldName}(s)`;
    return `every ${step} ${fieldName}(s) starting at ${base}`;
  }
  if (value.includes(",")) {
    const parts = value
      .split(",")
      .map((v) => (names ? names[parseInt(v)] || v : v));
    return `${fieldName} ${parts.join(", ")}`;
  }
  if (value.includes("-")) {
    const [start, end] = value.split("-");
    const startName = names ? names[parseInt(start!)] || start : start;
    const endName = names ? names[parseInt(end!)] || end : end;
    return `${fieldName} ${startName} through ${endName}`;
  }
  const name = names ? names[parseInt(value)] || value : value;
  return `at ${fieldName} ${name}`;
}

function execute(input: Input): Output {
  const expr = input.input.trim();
  if (!expr) throw new Error("Cron expression cannot be empty");

  const fields = expr.split(/\s+/);
  if (fields.length < 5 || fields.length > 6) {
    throw new Error(
      "Cron expression must have 5 or 6 fields: minute hour day-of-month month day-of-week [year]"
    );
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  const parts: string[] = [];

  // Minute
  if (minute !== "*") parts.push(describeField(minute!, "minute"));
  else parts.push("every minute");

  // Hour
  if (hour !== "*") parts.push(describeField(hour!, "hour"));

  // Day of month
  if (dayOfMonth !== "*" && dayOfMonth !== "?") {
    parts.push(describeField(dayOfMonth!, "day-of-month"));
  }

  // Month
  if (month !== "*") {
    parts.push(describeField(month!, "month", MONTHS));
  }

  // Day of week
  if (dayOfWeek !== "*" && dayOfWeek !== "?") {
    parts.push(describeField(dayOfWeek!, "day-of-week", DAYS_OF_WEEK));
  }

  const lines: string[] = [];
  lines.push(`Cron: ${expr}`);
  lines.push("");
  lines.push("Schedule: " + parts.join(", "));
  lines.push("");
  lines.push("Fields:");
  lines.push(`  Minute:       ${minute} (0-59)`);
  lines.push(`  Hour:         ${hour} (0-23)`);
  lines.push(`  Day of Month: ${dayOfMonth} (1-31)`);
  lines.push(`  Month:        ${month} (1-12)`);
  lines.push(`  Day of Week:  ${dayOfWeek} (0-6, Sun=0)`);
  if (fields.length === 6) {
    lines.push(`  Year:         ${fields[5]} (optional)`);
  }

  return { output: lines.join("\n") };
}

export const cronParser = defineTool({
  meta: {
    id: "datetime/cron-parser",
    name: "Cron Parser",
    description:
      "Free online cron parser — explain cron expressions in human-readable form instantly in your browser. No data is stored. Breaks down minute, hour, day, month, and weekday fields.",
    category: "datetime",
    subgroup: "Cron & Scheduling",
    tier: ToolTier.CLIENT,
    keywords: ["cron", "parse", "explain", "schedule", "expression"],
    examples: [
      {
        title: "Parse Daily Midnight Cron",
        description: "Explain a cron expression that runs daily at midnight",
        input: "0 0 * * *",
        output:
          "Cron: 0 0 * * *\n\nSchedule: at minute 0, at hour 0\n\nFields:\n  Minute:       0 (0-59)\n  Hour:         0 (0-23)\n  Day of Month: * (1-31)\n  Month:        * (1-12)\n  Day of Week:  * (0-6, Sun=0)",
      },
      {
        title: "Parse Weekday Cron",
        description:
          "Explain a cron expression that runs on weekdays at 9:30 AM",
        input: "30 9 * * 1-5",
        output:
          "Cron: 30 9 * * 1-5\n\nSchedule: at minute 30, at hour 9, day-of-week Monday through Friday\n\nFields:\n  Minute:       30 (0-59)\n  Hour:         9 (0-23)\n  Day of Month: * (1-31)\n  Month:        * (1-12)\n  Day of Week:  1-5 (0-6, Sun=0)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
