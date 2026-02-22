import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Natural language schedule description"),
});

const outputSchema = z.object({
  output: z.string().describe("Cron expression"),
  confidence: z.string().describe("Confidence level of the conversion"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const PATTERNS: Array<{
  regex: RegExp;
  cron: string | ((m: RegExpMatchArray) => string);
}> = [
  { regex: /^every\s+minute$/i, cron: "* * * * *" },
  { regex: /^every\s+(\d+)\s+minutes?$/i, cron: (m) => `*/${m[1]} * * * *` },
  { regex: /^every\s+5\s+minutes?$/i, cron: "*/5 * * * *" },
  { regex: /^every\s+10\s+minutes?$/i, cron: "*/10 * * * *" },
  { regex: /^every\s+15\s+minutes?$/i, cron: "*/15 * * * *" },
  { regex: /^every\s+30\s+minutes?$/i, cron: "*/30 * * * *" },
  { regex: /^every\s+hour$/i, cron: "0 * * * *" },
  { regex: /^every\s+(\d+)\s+hours?$/i, cron: (m) => `0 */${m[1]} * * *` },
  { regex: /^every\s+day\s+at\s+midnight$/i, cron: "0 0 * * *" },
  { regex: /^every\s+day\s+at\s+noon$/i, cron: "0 12 * * *" },
  {
    regex: /^every\s+day\s+at\s+(\d{1,2}):(\d{2})$/i,
    cron: (m) => `${parseInt(m[2]!)} ${parseInt(m[1]!)} * * *`,
  },
  {
    regex: /^every\s+day\s+at\s+(\d{1,2})\s*(am|pm)$/i,
    cron: (m) => {
      let h = parseInt(m[1]!);
      if (m[2]!.toLowerCase() === "pm" && h !== 12) h += 12;
      if (m[2]!.toLowerCase() === "am" && h === 12) h = 0;
      return `0 ${h} * * *`;
    },
  },
  { regex: /^every\s+monday$/i, cron: "0 9 * * 1" },
  { regex: /^every\s+tuesday$/i, cron: "0 9 * * 2" },
  { regex: /^every\s+wednesday$/i, cron: "0 9 * * 3" },
  { regex: /^every\s+thursday$/i, cron: "0 9 * * 4" },
  { regex: /^every\s+friday$/i, cron: "0 9 * * 5" },
  { regex: /^every\s+saturday$/i, cron: "0 9 * * 6" },
  { regex: /^every\s+sunday$/i, cron: "0 9 * * 0" },
  { regex: /^every\s+weekday$/i, cron: "0 9 * * 1-5" },
  { regex: /^every\s+weekend$/i, cron: "0 9 * * 0,6" },
  { regex: /^(first|1st)\s+of\s+every\s+month$/i, cron: "0 0 1 * *" },
  { regex: /^every\s+month$/i, cron: "0 0 1 * *" },
  { regex: /^every\s+week$/i, cron: "0 0 * * 0" },
  { regex: /^every\s+year$/i, cron: "0 0 1 1 *" },
  { regex: /^twice\s+a\s+day$/i, cron: "0 0,12 * * *" },
  { regex: /^once\s+a\s+week$/i, cron: "0 0 * * 0" },
  { regex: /^once\s+a\s+month$/i, cron: "0 0 1 * *" },
];

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  for (const pattern of PATTERNS) {
    const match = str.match(pattern.regex);
    if (match) {
      const cron =
        typeof pattern.cron === "function" ? pattern.cron(match) : pattern.cron;
      return { output: cron, confidence: "high" };
    }
  }

  return {
    output:
      "Unable to convert. Try simpler phrases like:\n  'every 5 minutes'\n  'every day at 9am'\n  'every monday'\n  'every weekday'\n  'first of every month'",
    confidence: "none",
  };
}

export const englishToCron = defineTool({
  meta: {
    id: "datetime/english-to-cron",
    name: "English to Cron",
    description:
      "Free online English to cron converter — turn natural language schedule descriptions into cron expressions instantly in your browser. No data is stored. Supports phrases like 'every weekday' and 'every day at 9am'.",
    category: "datetime",
    subgroup: "Cron & Scheduling",
    tier: ToolTier.CLIENT,
    keywords: ["cron", "english", "natural", "language", "convert"],
    examples: [
      {
        title: "Every Weekday",
        description: "Convert a natural language schedule to a cron expression",
        input: "every weekday",
        output: "0 9 * * 1-5",
      },
      {
        title: "Daily at Specific Time",
        description: "Convert a specific daily schedule to cron",
        input: "every day at 9:30",
        output: "30 9 * * *",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
