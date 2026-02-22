import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const DEFAULT_CITIES = [
  { name: "New York", tz: "America/New_York" },
  { name: "London", tz: "Europe/London" },
  { name: "Paris", tz: "Europe/Paris" },
  { name: "Dubai", tz: "Asia/Dubai" },
  { name: "Mumbai", tz: "Asia/Kolkata" },
  { name: "Singapore", tz: "Asia/Singapore" },
  { name: "Tokyo", tz: "Asia/Tokyo" },
  { name: "Sydney", tz: "Australia/Sydney" },
  { name: "Los Angeles", tz: "America/Los_Angeles" },
  { name: "Chicago", tz: "America/Chicago" },
];

const inputSchema = z.object({
  cities: z
    .string()
    .default("")
    .describe(
      "Comma-separated list of IANA timezones (leave empty for defaults)"
    ),
});

const outputSchema = z.object({
  output: z.string().describe("World clock display"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const now = new Date();
  const lines: string[] = [];
  lines.push("=== World Clock ===");
  lines.push(`Reference: ${now.toISOString()}`);
  lines.push("");

  let cities: Array<{ name: string; tz: string }>;

  if (input.cities) {
    cities = input.cities.split(",").map((tz) => {
      const trimmed = tz.trim();
      const name = trimmed.split("/").pop()?.replace(/_/g, " ") || trimmed;
      return { name, tz: trimmed };
    });
  } else {
    cities = DEFAULT_CITIES;
  }

  for (const city of cities) {
    try {
      const time = now.toLocaleString("en-US", {
        timeZone: city.tz,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      lines.push(`${city.name.padEnd(16)} ${time}`);
    } catch {
      lines.push(`${city.name.padEnd(16)} (invalid timezone: ${city.tz})`);
    }
  }

  return { output: lines.join("\n") };
}

export const worldClock = defineTool({
  meta: {
    id: "datetime/world-clock",
    name: "World Clock",
    description:
      "Free online world clock — view current time in multiple cities around the world instantly in your browser. No data is stored. Shows 10 major cities by default or custom IANA timezones.",
    category: "datetime",
    subgroup: "Time Tools",
    tier: ToolTier.CLIENT,
    keywords: ["world", "clock", "time", "cities", "global"],
    examples: [
      {
        title: "Default World Clock",
        description: "Show current time in major cities worldwide",
        input: { cities: "" },
        output: "(World clock output — times vary based on current time)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
