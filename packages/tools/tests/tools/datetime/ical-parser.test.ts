import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { icalParser } from "../../../src/tools/datetime/ical-parser";

describe("iCal Parser", () => {
  it("should have correct metadata", () => {
    expect(icalParser.meta.id).toBe("datetime/ical-parser");
    expect(icalParser.meta.category).toBe("datetime");
  });

  it("should parse a valid iCal event", async () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "SUMMARY:Team Meeting",
      "DTSTART:20240615T100000Z",
      "DTEND:20240615T110000Z",
      "DESCRIPTION:Weekly sync",
      "LOCATION:Room A",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const result = await executeTool(icalParser, { input: icsContent });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const events = data.events as Array<Record<string, string>>;
      expect(events.length).toBe(1);
      expect(events[0]!.summary).toBe("Team Meeting");
      expect(events[0]!.location).toBe("Room A");
      expect(events[0]!.description).toBe("Weekly sync");
    }
  });

  it("should parse multiple events", async () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:Event 1",
      "DTSTART:20240101T090000Z",
      "DTEND:20240101T100000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:Event 2",
      "DTSTART:20240102T090000Z",
      "DTEND:20240102T100000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const result = await executeTool(icalParser, { input: icsContent });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const events = data.events as Array<Record<string, string>>;
      expect(events.length).toBe(2);
    }
  });

  it("should parse all-day event date", async () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:Holiday",
      "DTSTART;VALUE=DATE:20241225",
      "DTEND;VALUE=DATE:20241226",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const result = await executeTool(icalParser, { input: icsContent });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const events = data.events as Array<Record<string, string>>;
      expect(events[0]!.start).toContain("2024-12-25");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(icalParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid format", async () => {
    const result = await executeTool(icalParser, {
      input: "not an ical file",
    });
    expect(result.success).toBe(false);
  });

  it("should handle event without optional fields", async () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20240101T090000Z",
      "DTEND:20240101T100000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const result = await executeTool(icalParser, { input: icsContent });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("(untitled)");
    }
  });
});
