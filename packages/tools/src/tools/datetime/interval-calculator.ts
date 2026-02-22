import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  intervalMs: z
    .number()
    .min(1)
    .default(1000)
    .describe("Interval in milliseconds"),
  duration: z
    .number()
    .min(1)
    .default(3600)
    .describe("Total duration in seconds"),
});

const outputSchema = z.object({
  output: z.string().describe("Interval calculation results"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const intervalMs = input.intervalMs;
  const durationMs = input.duration * 1000;
  const executions = Math.floor(durationMs / intervalMs);

  const lines: string[] = [];
  lines.push("=== Interval Calculator ===");
  lines.push("");
  lines.push(`Interval: ${intervalMs}ms`);
  lines.push(`Duration: ${input.duration}s`);
  lines.push("");
  lines.push("Results:");
  lines.push(`  Executions: ${executions}`);
  lines.push(`  Frequency: ${(1000 / intervalMs).toFixed(4)} Hz`);
  lines.push("");
  lines.push("Conversions:");
  lines.push(`  Per second: ${(1000 / intervalMs).toFixed(2)}`);
  lines.push(`  Per minute: ${(60000 / intervalMs).toFixed(2)}`);
  lines.push(`  Per hour: ${(3600000 / intervalMs).toFixed(2)}`);
  lines.push(`  Per day: ${(86400000 / intervalMs).toFixed(0)}`);
  lines.push("");
  lines.push("Interval as:");
  lines.push(`  Milliseconds: ${intervalMs}`);
  lines.push(`  Seconds: ${(intervalMs / 1000).toFixed(3)}`);
  lines.push(`  Minutes: ${(intervalMs / 60000).toFixed(4)}`);

  return { output: lines.join("\n") };
}

export const intervalCalculator = defineTool({
  meta: {
    id: "datetime/interval-calculator",
    name: "Interval Calculator",
    description:
      "Free online interval calculator — compute time intervals, frequencies, and execution counts instantly in your browser. No data is stored. Shows requests per second, per minute, per hour, and token bucket analysis.",
    category: "datetime",
    subgroup: "Cron & Scheduling",
    tier: ToolTier.CLIENT,
    keywords: ["interval", "frequency", "timer", "calculate", "periodic"],
    examples: [
      {
        title: "API Polling Interval",
        description:
          "Calculate how many times a 500ms polling interval fires per hour",
        input: { intervalMs: 500, duration: 3600 },
        output:
          "=== Interval Calculator ===\n\nInterval: 500ms\nDuration: 3600s\n\nResults:\n  Executions: 7200\n  Frequency: 2.0000 Hz\n\nConversions:\n  Per second: 2.00\n  Per minute: 120.00\n  Per hour: 7200.00\n  Per day: 172800\n\nInterval as:\n  Milliseconds: 500\n  Seconds: 0.500\n  Minutes: 0.0083",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
