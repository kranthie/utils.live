import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  preset: z
    .enum([
      "every-minute",
      "every-5-minutes",
      "every-15-minutes",
      "every-30-minutes",
      "every-hour",
      "every-day-midnight",
      "every-day-noon",
      "every-monday",
      "every-weekday",
      "every-weekend",
      "first-of-month",
      "last-day-of-month",
      "custom",
    ])
    .default("every-hour")
    .describe("Preset schedule"),
  minute: z.string().default("*").describe("Minute field (0-59)"),
  hour: z.string().default("*").describe("Hour field (0-23)"),
  dayOfMonth: z.string().default("*").describe("Day of month (1-31)"),
  month: z.string().default("*").describe("Month (1-12)"),
  dayOfWeek: z.string().default("*").describe("Day of week (0-6, Sun=0)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated cron expression"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const PRESETS: Record<string, string> = {
  "every-minute": "* * * * *",
  "every-5-minutes": "*/5 * * * *",
  "every-15-minutes": "*/15 * * * *",
  "every-30-minutes": "*/30 * * * *",
  "every-hour": "0 * * * *",
  "every-day-midnight": "0 0 * * *",
  "every-day-noon": "0 12 * * *",
  "every-monday": "0 9 * * 1",
  "every-weekday": "0 9 * * 1-5",
  "every-weekend": "0 9 * * 0,6",
  "first-of-month": "0 0 1 * *",
  "last-day-of-month": "0 0 28-31 * *",
};

function execute(input: Input): Output {
  let expression: string;

  if (input.preset !== "custom" && PRESETS[input.preset]) {
    expression = PRESETS[input.preset]!;
  } else {
    expression = `${input.minute} ${input.hour} ${input.dayOfMonth} ${input.month} ${input.dayOfWeek}`;
  }

  // Validate by checking each field
  const fields = expression.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const lines: string[] = [];
  lines.push(`Cron Expression: ${expression}`);
  lines.push("");
  lines.push(`Minute:       ${fields[0]}`);
  lines.push(`Hour:         ${fields[1]}`);
  lines.push(`Day of Month: ${fields[2]}`);
  lines.push(`Month:        ${fields[3]}`);
  lines.push(`Day of Week:  ${fields[4]}`);

  return { output: lines.join("\n") };
}

export const cronBuilder = defineTool({
  meta: {
    id: "datetime/cron-builder",
    name: "Cron Builder",
    description:
      "Free online cron builder — create cron expressions with presets or custom fields instantly in your browser. No data is stored. Supports presets like hourly, daily, weekday, and custom schedules.",
    category: "datetime",
    subgroup: "Cron & Scheduling",
    tier: ToolTier.CLIENT,
    keywords: ["cron", "build", "create", "schedule", "generator"],
    examples: [
      {
        title: "Every Weekday at 9 AM",
        description: "Build a cron expression using a preset for weekdays",
        input: {
          preset: "every-weekday",
          minute: "*",
          hour: "*",
          dayOfMonth: "*",
          month: "*",
          dayOfWeek: "*",
        },
        output:
          "Cron Expression: 0 9 * * 1-5\n\nMinute:       0\nHour:         9\nDay of Month: *\nMonth:        *\nDay of Week:  1-5",
      },
      {
        title: "Custom Schedule",
        description:
          "Build a custom cron for every 15 minutes during business hours",
        input: {
          preset: "custom",
          minute: "*/15",
          hour: "9-17",
          dayOfMonth: "*",
          month: "*",
          dayOfWeek: "1-5",
        },
        output:
          "Cron Expression: */15 9-17 * * 1-5\n\nMinute:       */15\nHour:         9-17\nDay of Month: *\nMonth:        *\nDay of Week:  1-5",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
