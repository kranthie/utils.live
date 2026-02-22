import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string or ISO 8601 string to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("ISO 8601 formatted string"),
  dateOnly: z.string().describe("Date only (YYYY-MM-DD)"),
  dateTime: z.string().describe("Date and time (YYYY-MM-DDTHH:mm:ss)"),
  full: z.string().describe("Full ISO with timezone"),
  week: z.string().describe("ISO week date (YYYY-Www)"),
  ordinal: z.string().describe("ISO ordinal date (YYYY-DDD)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { year: d.getUTCFullYear(), week };
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
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

  const dateOnly = date.toISOString().split("T")[0]!;
  const dateTime = date.toISOString().replace(/\.\d{3}Z$/, "");
  const full = date.toISOString();

  const { year, week } = getISOWeek(date);
  const weekStr = `${year}-W${String(week).padStart(2, "0")}`;

  const dayOfYear = getDayOfYear(date);
  const ordinal = `${date.getFullYear()}-${String(dayOfYear).padStart(3, "0")}`;

  const lines: string[] = [];
  lines.push(`ISO 8601 Formats:`);
  lines.push(`  Date:      ${dateOnly}`);
  lines.push(`  DateTime:  ${dateTime}`);
  lines.push(`  Full:      ${full}`);
  lines.push(`  Week:      ${weekStr}`);
  lines.push(`  Ordinal:   ${ordinal}`);

  return {
    output: lines.join("\n"),
    dateOnly,
    dateTime,
    full,
    week: weekStr,
    ordinal,
  };
}

export const iso8601Converter = defineTool({
  meta: {
    id: "datetime/iso8601-converter",
    name: "ISO 8601 Converter",
    description:
      "Free online ISO 8601 converter — convert dates to all ISO 8601 representations instantly in your browser. No data is stored. Shows date-only, date-time, full, ISO week, and ordinal formats.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["iso", "8601", "date", "format", "convert", "standard"],
    examples: [
      {
        title: "Convert Date to ISO Formats",
        description: "Convert a date to all ISO 8601 representations",
        input: "2025-03-15T14:30:00Z",
        output:
          "ISO 8601 Formats:\n  Date:      2025-03-15\n  DateTime:  2025-03-15T14:30:00\n  Full:      2025-03-15T14:30:00.000Z\n  Week:      2025-W11\n  Ordinal:   2025-074",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
