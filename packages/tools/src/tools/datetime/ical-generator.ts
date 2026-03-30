import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("Meeting").describe("Event title"),
  startDate: z
    .string()
    .default("")
    .describe("Start date (ISO format or YYYY-MM-DD HH:MM)"),
  endDate: z
    .string()
    .default("")
    .describe("End date (ISO format or YYYY-MM-DD HH:MM)"),
  description: z.string().default("").describe("Event description"),
  location: z.string().default("").describe("Event location"),
  allDay: z.boolean().default(false).describe("All-day event"),
});

const outputSchema = z.object({
  output: z.string().describe("iCalendar (.ics) file content"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function formatICalDate(date: Date, allDay: boolean): string {
  if (allDay) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function execute(input: Input): Output {
  const now = new Date();
  const startDate = input.startDate
    ? new Date(input.startDate)
    : new Date(now.getTime() + 86400000);
  const endDate = input.endDate
    ? new Date(input.endDate)
    : new Date(startDate.getTime() + 3600000);

  if (isNaN(startDate.getTime())) throw new Error("Invalid start date");
  if (isNaN(endDate.getTime())) throw new Error("Invalid end date");

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@utils.live`;
  const stamp = formatICalDate(now, false);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//utils.live//Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
  ];

  if (input.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICalDate(startDate, true)}`);
    lines.push(`DTEND;VALUE=DATE:${formatICalDate(endDate, true)}`);
  } else {
    lines.push(`DTSTART:${formatICalDate(startDate, false)}`);
    lines.push(`DTEND:${formatICalDate(endDate, false)}`);
  }

  lines.push(`SUMMARY:${input.title}`);
  if (input.description)
    lines.push(`DESCRIPTION:${input.description.replace(/\n/g, "\\n")}`);
  if (input.location) lines.push(`LOCATION:${input.location}`);
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return { output: lines.join("\r\n") };
}

export const icalGenerator = defineTool({
  meta: {
    id: "datetime/ical-generator",
    name: "iCal Generator",
    description:
      "Free online iCal generator — create .ics calendar file content for events instantly in your browser. No data is stored. Supports all-day events, descriptions, and locations.",
    category: "datetime",
    subgroup: "Calendar",
    tier: ToolTier.CLIENT,
    keywords: ["ical", "ics", "calendar", "event", "generate"],
    examples: [
      {
        title: "Team Meeting Event",
        description: "Create an iCal event for a team meeting",
        input: {
          title: "Sprint Planning",
          startDate: "2025-03-15T10:00:00Z",
          endDate: "2025-03-15T11:00:00Z",
          description: "Weekly sprint planning session",
          location: "Conference Room B",
          allDay: false,
        },
        output: "(iCal output — UID and DTSTAMP vary based on current time)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
