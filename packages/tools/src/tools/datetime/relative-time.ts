import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Date string or timestamp"),
});

const outputSchema = z.object({
  output: z.string().describe("Relative time string"),
  relative: z.string().describe("Human-readable relative time"),
  direction: z.string().describe("past or future"),
  diffMs: z.number().describe("Difference in milliseconds"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function formatRelative(diffMs: number): string {
  const abs = Math.abs(diffMs);
  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  const suffix = diffMs < 0 ? "ago" : "from now";

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} seconds ${suffix}`;
  if (minutes < 2) return `1 minute ${suffix}`;
  if (minutes < 60) return `${minutes} minutes ${suffix}`;
  if (hours < 2) return `1 hour ${suffix}`;
  if (hours < 24) return `${hours} hours ${suffix}`;
  if (days < 2) return `1 day ${suffix}`;
  if (days < 7) return `${days} days ${suffix}`;
  if (weeks < 2) return `1 week ${suffix}`;
  if (weeks < 5) return `${weeks} weeks ${suffix}`;
  if (months < 2) return `1 month ${suffix}`;
  if (months < 12) return `${months} months ${suffix}`;
  if (years < 2) return `1 year ${suffix}`;
  return `${years} years ${suffix}`;
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

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const relative = formatRelative(diffMs);
  const direction = diffMs < 0 ? "past" : "future";

  return {
    output: `${relative}\n(${date.toISOString()})`,
    relative,
    direction,
    diffMs,
  };
}

export const relativeTime = defineTool({
  meta: {
    id: "datetime/relative-time",
    name: "Relative Time",
    description:
      "Free online relative time converter — convert dates to human-readable relative format like '2 days ago' instantly in your browser. No data is stored. Supports past and future dates with auto-scaling units.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["relative", "time", "ago", "from now", "human", "readable"],
    examples: [
      {
        title: "Past Date",
        description: "Convert a past date to a relative time string",
        input: "2020-01-01T00:00:00Z",
        output:
          "(Relative time output — varies based on current date, e.g., '5 years ago')",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
