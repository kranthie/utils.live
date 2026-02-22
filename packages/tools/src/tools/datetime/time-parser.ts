import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Time string to parse (e.g., 2:30 PM, 14:30, 14:30:00)"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed time information"),
  hours24: z.number().describe("Hours in 24-hour format"),
  hours12: z.number().describe("Hours in 12-hour format"),
  minutes: z.number().describe("Minutes"),
  seconds: z.number().describe("Seconds"),
  period: z.string().describe("AM or PM"),
  formatted24: z.string().describe("Formatted 24-hour time"),
  formatted12: z.string().describe("Formatted 12-hour time"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  // Try 12-hour format: 2:30 PM, 2:30:00 PM
  const match12 = str.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|AM|PM|a\.m\.|p\.m\.)$/
  );
  if (match12) {
    hours = parseInt(match12[1]!, 10);
    minutes = parseInt(match12[2]!, 10);
    seconds = match12[3] ? parseInt(match12[3], 10) : 0;
    const period = match12[4]!.toLowerCase().replace(/\./g, "");
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
  } else {
    // Try 24-hour format: 14:30, 14:30:00
    const match24 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match24) {
      hours = parseInt(match24[1]!, 10);
      minutes = parseInt(match24[2]!, 10);
      seconds = match24[3] ? parseInt(match24[3], 10) : 0;
    } else {
      throw new Error(
        "Unable to parse time string. Expected formats: HH:MM, HH:MM:SS, H:MM AM/PM"
      );
    }
  }

  if (hours < 0 || hours > 23) throw new Error("Hours must be 0-23");
  if (minutes < 0 || minutes > 59) throw new Error("Minutes must be 0-59");
  if (seconds < 0 || seconds > 59) throw new Error("Seconds must be 0-59");

  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const period = hours >= 12 ? "PM" : "AM";
  const formatted24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const formatted12 = `${hours12}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${period}`;

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  const lines: string[] = [];
  lines.push(`24-hour: ${formatted24}`);
  lines.push(`12-hour: ${formatted12}`);
  lines.push(`Total seconds since midnight: ${totalSeconds}`);

  return {
    output: lines.join("\n"),
    hours24: hours,
    hours12,
    minutes,
    seconds,
    period,
    formatted24,
    formatted12,
  };
}

export const timeParser = defineTool({
  meta: {
    id: "datetime/time-parser",
    name: "Time Parser",
    description:
      "Free online time parser — parse any time string format into hours, minutes, and seconds components instantly in your browser. No data is stored. Outputs both 12-hour and 24-hour formats.",
    category: "datetime",
    subgroup: "Time Tools",
    tier: ToolTier.CLIENT,
    keywords: ["time", "parse", "format", "12hour", "24hour"],
    examples: [
      {
        title: "Parse 12-Hour Time",
        description: "Parse a 12-hour time string into its components",
        input: "3:45 PM",
        output:
          "24-hour: 15:45:00\n12-hour: 3:45:00 PM\nTotal seconds since midnight: 56700",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
