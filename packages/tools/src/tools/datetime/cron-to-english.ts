import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Cron expression to translate"),
});

const outputSchema = z.object({
  output: z.string().describe("English description"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const DOW_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
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

function fieldToEnglish(field: string, unit: string, names?: string[]): string {
  if (field === "*" || field === "?") return "";

  if (field.includes("/")) {
    const [base, step] = field.split("/");
    if (base === "*" || base === "0") return `every ${step} ${unit}s`;
    return `every ${step} ${unit}s starting at ${unit} ${names ? names[parseInt(base!)] || base : base}`;
  }

  if (field.includes(",")) {
    const vals = field
      .split(",")
      .map((v) => (names ? names[parseInt(v)] || v : v));
    return `on ${unit}s ${vals.join(", ")}`;
  }

  if (field.includes("-")) {
    const [start, end] = field.split("-");
    const s = names ? names[parseInt(start!)] || start : start;
    const e = names ? names[parseInt(end!)] || end : end;
    return `${unit}s ${s} through ${e}`;
  }

  return `at ${unit} ${names ? names[parseInt(field)] || field : field}`;
}

function execute(input: Input): Output {
  const expr = input.input.trim();
  const fields = expr.split(/\s+/);

  if (fields.length < 5) {
    throw new Error("Cron expression must have at least 5 fields");
  }

  const [minute, hour, dom, month, dow] = fields;

  // Common patterns
  if (expr === "* * * * *") return { output: "Every minute" };
  if (expr === "0 * * * *")
    return { output: "Every hour, at the start of the hour" };
  if (expr === "0 0 * * *") return { output: "Every day at midnight" };
  if (expr === "0 12 * * *") return { output: "Every day at noon" };
  if (/^\*\/(\d+) \* \* \* \*$/.test(expr)) {
    const m = expr.match(/^\*\/(\d+)/);
    return { output: `Every ${m![1]} minutes` };
  }
  if (/^0 \*\/(\d+) \* \* \*$/.test(expr)) {
    const m = expr.match(/\*\/(\d+)/);
    return { output: `Every ${m![1]} hours` };
  }

  const parts: string[] = [];

  const minuteDesc = fieldToEnglish(minute!, "minute");
  const hourDesc = fieldToEnglish(hour!, "hour");
  const domDesc = fieldToEnglish(dom!, "day");
  const monthDesc = fieldToEnglish(month!, "month", MONTH_NAMES);
  const dowDesc = fieldToEnglish(dow!, "day", DOW_NAMES);

  if (minute === "*") {
    parts.push("Every minute");
  } else if (minute === "0") {
    // Will be part of "at HH:00"
  } else {
    parts.push(minuteDesc);
  }

  if (hourDesc) parts.push(hourDesc);
  if (minute !== "*" && hour !== "*") {
    parts.length = 0;
    parts.push(`At ${hour!.padStart(2, "0")}:${minute!.padStart(2, "0")}`);
  }

  if (domDesc) parts.push(domDesc);
  if (monthDesc) parts.push(monthDesc);
  if (dowDesc) parts.push(dowDesc);

  return { output: parts.join(", ") || "Every minute" };
}

export const cronToEnglish = defineTool({
  meta: {
    id: "datetime/cron-to-english",
    name: "Cron to English",
    description:
      "Free online cron to English converter — translate cron expressions to plain English instantly in your browser. No data is stored. Supports common patterns and complex schedules.",
    category: "datetime",
    subgroup: "Cron & Scheduling",
    tier: ToolTier.CLIENT,
    keywords: ["cron", "english", "human", "readable", "translate"],
    examples: [
      {
        title: "Every 5 Minutes",
        description: "Translate a cron expression that runs every 5 minutes",
        input: "*/5 * * * *",
        output: "Every 5 minutes",
      },
      {
        title: "Daily at Noon",
        description: "Translate a cron expression that runs daily at noon",
        input: "0 12 * * *",
        output: "Every day at noon",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
