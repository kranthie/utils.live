import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("First duration (HH:MM:SS or seconds)"),
  input2: z.string().describe("Second duration (HH:MM:SS or seconds)"),
});

const optionsSchema = z.object({
  operation: z.enum(["add", "subtract"]).default("add").describe("Operation"),
});

const outputSchema = z.object({
  output: z.string().describe("Result duration"),
  original: z.string().describe("First duration"),
  modified: z.string().describe("Second duration"),
  resultSeconds: z.number().describe("Result in total seconds"),
  resultFormatted: z.string().describe("Result as HH:MM:SS"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function parseDuration(str: string): number {
  const trimmed = str.trim();
  const num = Number(trimmed);
  if (!isNaN(num) && !trimmed.includes(":")) return num;

  const parts = trimmed.split(":");
  if (parts.length === 3) {
    return (
      parseInt(parts[0]!, 10) * 3600 +
      parseInt(parts[1]!, 10) * 60 +
      parseFloat(parts[2]!)
    );
  }
  if (parts.length === 2) {
    return parseInt(parts[0]!, 10) * 60 + parseFloat(parts[1]!);
  }
  throw new Error(`Unable to parse duration: "${str}"`);
}

function formatDuration(totalSeconds: number): string {
  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  const prefix = negative ? "-" : "";
  return `${prefix}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function execute(input: Input, options?: Options): Output {
  const a = parseDuration(input.input1);
  const b = parseDuration(input.input2);
  const op = options?.operation ?? "add";

  const result = op === "add" ? a + b : a - b;

  const lines: string[] = [];
  lines.push(
    `${formatDuration(a)} ${op === "add" ? "+" : "-"} ${formatDuration(b)} = ${formatDuration(result)}`
  );
  lines.push("");
  lines.push(`Result: ${formatDuration(result)}`);
  lines.push(`Total seconds: ${Math.round(result)}`);

  return {
    output: lines.join("\n"),
    original: formatDuration(a),
    modified: formatDuration(b),
    resultSeconds: Math.round(result),
    resultFormatted: formatDuration(result),
  };
}

export const durationCalculator = defineTool({
  meta: {
    id: "datetime/duration-calculator",
    name: "Duration Calculator",
    description:
      "Free online duration calculator — add and subtract time durations in HH:MM:SS format instantly in your browser. No data is stored. Shows result in formatted time and total seconds.",
    category: "datetime",
    subgroup: "Time Tools",
    tier: ToolTier.CLIENT,
    keywords: ["duration", "time", "add", "subtract", "hours", "minutes"],
    examples: [
      {
        title: "Add Two Durations",
        description: "Add a 2-hour meeting and a 45-minute session",
        input: { input1: "02:00:00", input2: "00:45:00" },
        output:
          "02:00:00 + 00:45:00 = 02:45:00\n\nResult: 02:45:00\nTotal seconds: 9900",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
