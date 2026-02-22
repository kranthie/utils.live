import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Target date/time for countdown"),
});

const outputSchema = z.object({
  output: z.string().describe("Countdown result"),
  days: z.number(),
  hours: z.number(),
  minutes: z.number(),
  seconds: z.number(),
  isPast: z.boolean().describe("Whether the date is in the past"),
  totalMs: z.number().describe("Total milliseconds until/since target"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const target = new Date(str);
  if (isNaN(target.getTime())) throw new Error("Unable to parse target date");

  const now = Date.now();
  const diffMs = target.getTime() - now;
  const isPast = diffMs < 0;
  const abs = Math.abs(diffMs);

  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);

  const lines: string[] = [];
  if (isPast) {
    lines.push(`${days}d ${hours}h ${minutes}m ${seconds}s ago`);
    lines.push("");
    lines.push(`The date ${target.toISOString()} has already passed.`);
  } else {
    lines.push(`${days}d ${hours}h ${minutes}m ${seconds}s remaining`);
    lines.push("");
    lines.push(`Counting down to: ${target.toISOString()}`);
  }

  lines.push("");
  lines.push(`Days: ${days}`);
  lines.push(`Hours: ${days * 24 + hours}`);
  lines.push(`Minutes: ${Math.floor(abs / 60000)}`);
  lines.push(`Seconds: ${Math.floor(abs / 1000)}`);

  return {
    output: lines.join("\n"),
    days,
    hours,
    minutes,
    seconds,
    isPast,
    totalMs: diffMs,
  };
}

export const countdownCalculator = defineTool({
  meta: {
    id: "datetime/countdown-calculator",
    name: "Countdown Calculator",
    description:
      "Free online countdown calculator — compute time remaining until any target date instantly in your browser. No data is stored. Shows days, hours, minutes, and seconds breakdown.",
    category: "datetime",
    subgroup: "Time Tools",
    tier: ToolTier.CLIENT,
    keywords: ["countdown", "timer", "remaining", "until", "target"],
    examples: [
      {
        title: "New Year Countdown",
        description: "Calculate time remaining until New Year 2026",
        input: "2026-01-01T00:00:00Z",
        output: "(Countdown output — varies based on current date)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
