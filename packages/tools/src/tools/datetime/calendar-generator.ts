import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  month: z
    .number()
    .min(1)
    .max(12)
    .default(new Date().getMonth() + 1)
    .describe("Month (1-12)"),
  year: z
    .number()
    .min(1)
    .max(9999)
    .default(new Date().getFullYear())
    .describe("Year"),
});

const outputSchema = z.object({
  output: z.string().describe("Calendar text output"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const MONTH_NAMES = [
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

function execute(input: Input): Output {
  const { month, year } = input;
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const title = `${MONTH_NAMES[month - 1]} ${year}`;

  const lines: string[] = [];
  lines.push(title.padStart(Math.floor((20 + title.length) / 2)));
  lines.push("Su Mo Tu We Th Fr Sa");

  let line = "   ".repeat(firstDay);
  for (let day = 1; day <= daysInMonth; day++) {
    line += String(day).padStart(2) + " ";
    if ((firstDay + day) % 7 === 0) {
      lines.push(line.trimEnd());
      line = "";
    }
  }
  if (line.trim()) {
    lines.push(line.trimEnd());
  }

  return { output: lines.join("\n") };
}

export const calendarGenerator = defineTool({
  meta: {
    id: "datetime/calendar-generator",
    name: "Calendar Generator",
    description:
      "Free online calendar generator — create a text calendar for any month and year instantly in your browser. No data is stored. Displays weekday grid with Sun-Sat layout.",
    category: "datetime",
    subgroup: "Calendar",
    tier: ToolTier.CLIENT,
    keywords: ["calendar", "month", "generate", "display", "text"],
    examples: [
      {
        title: "January 2025 Calendar",
        description: "Generate a text calendar for January 2025",
        input: { month: 1, year: 2025 },
        output:
          "    January 2025\nSu Mo Tu We Th Fr Sa\n          1  2  3  4\n 5  6  7  8  9 10 11\n12 13 14 15 16 17 18\n19 20 21 22 23 24 25\n26 27 28 29 30 31",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
