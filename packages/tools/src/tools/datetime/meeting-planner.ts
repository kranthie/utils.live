import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  timezones: z
    .string()
    .default("America/New_York,Europe/London,Asia/Tokyo")
    .describe("Comma-separated IANA timezone names"),
  businessStart: z
    .number()
    .min(0)
    .max(23)
    .default(9)
    .describe("Business hours start (0-23)"),
  businessEnd: z
    .number()
    .min(0)
    .max(23)
    .default(17)
    .describe("Business hours end (0-23)"),
});

const outputSchema = z.object({
  output: z.string().describe("Meeting planner results"),
  overlappingHours: z
    .array(z.string())
    .describe("Overlapping business hours in UTC"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function getUtcOffset(tz: string): number {
  const now = new Date();
  const utcStr = now.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = now.toLocaleString("en-US", { timeZone: tz });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  return (tzDate.getTime() - utcDate.getTime()) / 3600000;
}

function execute(input: Input): Output {
  const tzNames = input.timezones
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tzNames.length < 2) {
    throw new Error("Please provide at least 2 timezones");
  }

  const offsets: Array<{ name: string; offset: number }> = [];
  for (const tz of tzNames) {
    try {
      const offset = getUtcOffset(tz);
      offsets.push({ name: tz, offset });
    } catch {
      throw new Error(`Invalid timezone: ${tz}`);
    }
  }

  // Find overlapping business hours
  const overlapping: string[] = [];
  for (let utcHour = 0; utcHour < 24; utcHour++) {
    let allInBusiness = true;
    for (const { offset } of offsets) {
      const localHour = (((utcHour + offset) % 24) + 24) % 24;
      if (localHour < input.businessStart || localHour >= input.businessEnd) {
        allInBusiness = false;
        break;
      }
    }
    if (allInBusiness) {
      overlapping.push(`${String(utcHour).padStart(2, "0")}:00 UTC`);
    }
  }

  const lines: string[] = [];
  lines.push("=== Meeting Planner ===");
  lines.push(
    `Business hours: ${input.businessStart}:00 - ${input.businessEnd}:00 local`
  );
  lines.push("");

  // Show each timezone's business hours in UTC
  for (const { name, offset } of offsets) {
    const startUtc = (((input.businessStart - offset) % 24) + 24) % 24;
    const endUtc = (((input.businessEnd - offset) % 24) + 24) % 24;
    const sign = offset >= 0 ? "+" : "";
    lines.push(
      `${name.padEnd(25)} UTC${sign}${offset} | Business: ${String(Math.floor(startUtc)).padStart(2, "0")}:00 - ${String(Math.floor(endUtc)).padStart(2, "0")}:00 UTC`
    );
  }

  lines.push("");
  if (overlapping.length > 0) {
    lines.push(`Overlapping hours (${overlapping.length}h):`);
    lines.push(overlapping.join(", "));

    // Show in each timezone
    lines.push("");
    for (const { name, offset } of offsets) {
      const localTimes = overlapping.map((utcTime) => {
        const h = parseInt(utcTime);
        const local = (((h + offset) % 24) + 24) % 24;
        return `${String(Math.floor(local)).padStart(2, "0")}:00`;
      });
      lines.push(`  ${name.padEnd(25)} ${localTimes.join(", ")}`);
    }
  } else {
    lines.push("No overlapping business hours found.");
    lines.push("Consider adjusting business hours or scheduling across days.");
  }

  return { output: lines.join("\n"), overlappingHours: overlapping };
}

export const meetingPlanner = defineTool({
  meta: {
    id: "datetime/meeting-planner",
    name: "Meeting Planner",
    description:
      "Free online meeting planner — find overlapping business hours between timezones instantly in your browser. No data is stored. Compares multiple IANA timezones and shows common availability windows.",
    category: "datetime",
    subgroup: "Time Tools",
    tier: ToolTier.CLIENT,
    keywords: ["meeting", "planner", "timezone", "overlap", "schedule"],
    examples: [
      {
        title: "US-Europe-Asia Meeting",
        description:
          "Find overlapping business hours between New York, London, and Tokyo",
        input: {
          timezones: "America/New_York,Europe/London,Asia/Tokyo",
          businessStart: 9,
          businessEnd: 17,
        },
        output:
          "(Meeting planner output — UTC offsets vary based on current DST rules)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
