import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("iCalendar (.ics) file content"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed calendar information"),
  events: z
    .array(
      z.object({
        summary: z.string(),
        start: z.string(),
        end: z.string(),
        description: z.string(),
        location: z.string(),
      })
    )
    .describe("Parsed events"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function parseICalDate(dateStr: string): string {
  // Format: 20240115T143000Z or 20240115
  const clean = dateStr.replace(/[;:].*$/, "").trim();
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  if (clean.length >= 15) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:${clean.slice(13, 15)}Z`;
  }
  return dateStr;
}

function execute(input: Input): Output {
  const content = input.input.trim();
  if (!content) throw new Error("Input cannot be empty");

  if (!content.includes("BEGIN:VCALENDAR")) {
    throw new Error("Invalid iCalendar format: missing BEGIN:VCALENDAR");
  }

  const events: Array<{
    summary: string;
    start: string;
    end: string;
    description: string;
    location: string;
  }> = [];

  const eventBlocks = content.split("BEGIN:VEVENT");
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i]!.split("END:VEVENT")[0] || "";
    const lines = block.split(/\r?\n/);

    let summary = "";
    let start = "";
    let end = "";
    let description = "";
    let location = "";

    for (const line of lines) {
      if (line.startsWith("SUMMARY:")) summary = line.slice(8);
      else if (line.startsWith("DTSTART")) {
        const val = line.split(":").slice(1).join(":");
        start = parseICalDate(val);
      } else if (line.startsWith("DTEND")) {
        const val = line.split(":").slice(1).join(":");
        end = parseICalDate(val);
      } else if (line.startsWith("DESCRIPTION:")) {
        description = line.slice(12).replace(/\\n/g, "\n");
      } else if (line.startsWith("LOCATION:")) {
        location = line.slice(9);
      }
    }

    events.push({ summary, start, end, description, location });
  }

  const lines: string[] = [];
  lines.push(`Found ${events.length} event(s)`);
  lines.push("");

  for (const event of events) {
    lines.push(`Title: ${event.summary || "(untitled)"}`);
    lines.push(`Start: ${event.start}`);
    lines.push(`End: ${event.end}`);
    if (event.location) lines.push(`Location: ${event.location}`);
    if (event.description) lines.push(`Description: ${event.description}`);
    lines.push("");
  }

  return { output: lines.join("\n"), events };
}

export const icalParser = defineTool({
  meta: {
    id: "datetime/ical-parser",
    name: "iCal Parser",
    description:
      "Free online iCal parser — parse .ics iCalendar file content into event details instantly in your browser. No data is stored. Extracts title, dates, location, and description.",
    category: "datetime",
    subgroup: "Calendar",
    tier: ToolTier.CLIENT,
    keywords: ["ical", "ics", "parse", "calendar", "event"],
    examples: [
      {
        title: "Parse iCal Event",
        description: "Parse an iCalendar file to extract event details",
        input:
          "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:Team Standup\r\nDTSTART:20250315T090000Z\r\nDTEND:20250315T091500Z\r\nLOCATION:Zoom\r\nEND:VEVENT\r\nEND:VCALENDAR",
        output:
          "Found 1 event(s)\n\nTitle: Team Standup\nStart: 2025-03-15T09:00:00Z\nEnd: 2025-03-15T09:15:00Z\nLocation: Zoom\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
