import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Time string in 12h or 24h format"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted time"),
  time12: z.string().describe("12-hour format"),
  time24: z.string().describe("24-hour format"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  let hours: number;
  let minutes: number;
  let seconds = 0;

  const match12 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|AM|PM)$/);
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (match12) {
    hours = parseInt(match12[1]!, 10);
    minutes = parseInt(match12[2]!, 10);
    seconds = match12[3] ? parseInt(match12[3], 10) : 0;
    const isPM = match12[4]!.toLowerCase() === "pm";
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else if (match24) {
    hours = parseInt(match24[1]!, 10);
    minutes = parseInt(match24[2]!, 10);
    seconds = match24[3] ? parseInt(match24[3], 10) : 0;
  } else {
    throw new Error("Unable to parse time. Use HH:MM or H:MM AM/PM format.");
  }

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    throw new Error("Invalid time values");
  }

  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const period = hours >= 12 ? "PM" : "AM";
  const secPart = seconds > 0 ? `:${String(seconds).padStart(2, "0")}` : "";

  const time24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}${secPart}`;
  const time12 = `${h12}:${String(minutes).padStart(2, "0")}${secPart} ${period}`;

  return {
    output: `24h: ${time24}\n12h: ${time12}`,
    time12,
    time24,
  };
}

export const time12h24hConverter = defineTool({
  meta: {
    id: "datetime/time-12h-24h-converter",
    name: "12h/24h Time Converter",
    description:
      "Free online 12h/24h time converter — convert between 12-hour and 24-hour time formats instantly in your browser. No data is stored. Handles AM/PM and supports seconds.",
    category: "datetime",
    subgroup: "Time Tools",
    tier: ToolTier.CLIENT,
    keywords: ["time", "12hour", "24hour", "convert", "format", "am", "pm"],
    examples: [
      {
        title: "12h to 24h",
        description: "Convert 2:30 PM to 24-hour format",
        input: "2:30 PM",
        output: "24h: 14:30\n12h: 2:30 PM",
      },
      {
        title: "24h to 12h",
        description: "Convert 17:45 to 12-hour format",
        input: "17:45",
        output: "24h: 17:45\n12h: 5:45 PM",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
