import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "America/Santiago",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Zurich",
  "Europe/Vienna",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Copenhagen",
  "Europe/Helsinki",
  "Europe/Warsaw",
  "Europe/Prague",
  "Europe/Budapest",
  "Europe/Bucharest",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Europe/Kiev",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Casablanca",
];

const inputSchema = z.object({
  filter: z.string().default("").describe("Filter timezones by region or name"),
});

const outputSchema = z.object({
  output: z.string().describe("List of timezone names"),
  timezones: z.array(z.string()).describe("Array of timezone names"),
  count: z.number().describe("Number of timezones"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  let filtered = TIMEZONES;

  if (input.filter) {
    const filterLower = input.filter.toLowerCase();
    filtered = TIMEZONES.filter((tz) => tz.toLowerCase().includes(filterLower));
  }

  const now = new Date();
  const lines = filtered.map((tz) => {
    try {
      const time = now.toLocaleString("en-US", {
        timeZone: tz,
        timeStyle: "short",
        hour12: false,
      });
      return `${tz.padEnd(30)} ${time}`;
    } catch {
      return tz;
    }
  });

  return {
    output: lines.join("\n"),
    timezones: filtered,
    count: filtered.length,
  };
}

export const timezoneList = defineTool({
  meta: {
    id: "datetime/timezone-list",
    name: "Timezone List",
    description:
      "Free online timezone list — browse all major IANA timezone names with current local times instantly in your browser. No data is stored. Filter by region like Europe, Asia, or America.",
    category: "datetime",
    subgroup: "Time Tools",
    tier: ToolTier.CLIENT,
    keywords: ["timezone", "list", "zones", "iana", "all"],
    examples: [
      {
        title: "Filter European Timezones",
        description: "List all European timezones with current times",
        input: { filter: "Europe" },
        output: "(Timezone list output — times vary based on current time)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
