import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Duration in milliseconds"),
});

const outputSchema = z.object({
  output: z.string().describe("Human-readable duration"),
  formatted: z.string().describe("Formatted duration string"),
  components: z
    .object({
      days: z.number(),
      hours: z.number(),
      minutes: z.number(),
      seconds: z.number(),
      milliseconds: z.number(),
    })
    .describe("Duration components"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const ms = Number(str);
  if (isNaN(ms)) throw new Error("Input must be a number (milliseconds)");

  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  const milliseconds = Math.floor(abs % 1000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
  if (milliseconds > 0 || parts.length === 0) parts.push(`${milliseconds} ms`);

  const prefix = ms < 0 ? "-" : "";
  const formatted = prefix + parts.join(", ");

  const lines: string[] = [];
  lines.push(`Input: ${ms} ms`);
  lines.push(`Formatted: ${formatted}`);
  lines.push("");
  lines.push("Breakdown:");
  lines.push(`  Days:         ${days}`);
  lines.push(`  Hours:        ${hours}`);
  lines.push(`  Minutes:      ${minutes}`);
  lines.push(`  Seconds:      ${seconds}`);
  lines.push(`  Milliseconds: ${milliseconds}`);

  return {
    output: lines.join("\n"),
    formatted,
    components: { days, hours, minutes, seconds, milliseconds },
  };
}

export const durationFormatter = defineTool({
  meta: {
    id: "datetime/duration-formatter",
    name: "Duration Formatter",
    description:
      "Free online duration formatter — convert milliseconds to human-readable duration instantly in your browser. No data is stored. Breaks down into days, hours, minutes, seconds, and ms.",
    category: "datetime",
    subgroup: "Time Tools",
    tier: ToolTier.CLIENT,
    keywords: ["duration", "format", "human", "readable", "milliseconds"],
    examples: [
      {
        title: "Format Milliseconds",
        description:
          "Convert 90061000 milliseconds to a human-readable duration",
        input: "90061000",
        output:
          "Input: 90061000 ms\nFormatted: 1 day, 1 hour, 1 minute, 1 second\n\nBreakdown:\n  Days:         1\n  Hours:        1\n  Minutes:      1\n  Seconds:      1\n  Milliseconds: 0",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
