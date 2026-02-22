import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { icalGenerator } from "../../../src/tools/datetime/ical-generator";

describe("iCal Generator", () => {
  it("should have correct metadata", () => {
    expect(icalGenerator.meta.id).toBe("datetime/ical-generator");
    expect(icalGenerator.meta.category).toBe("datetime");
  });

  it("should generate valid iCal output", async () => {
    const result = await executeTool(icalGenerator, {
      title: "Team Meeting",
      startDate: "2024-06-15T10:00:00Z",
      endDate: "2024-06-15T11:00:00Z",
      description: "Weekly sync",
      location: "Conference Room A",
      allDay: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("BEGIN:VCALENDAR");
      expect(output).toContain("END:VCALENDAR");
      expect(output).toContain("BEGIN:VEVENT");
      expect(output).toContain("END:VEVENT");
      expect(output).toContain("SUMMARY:Team Meeting");
      expect(output).toContain("DESCRIPTION:Weekly sync");
      expect(output).toContain("LOCATION:Conference Room A");
    }
  });

  it("should generate all-day event", async () => {
    const result = await executeTool(icalGenerator, {
      title: "Holiday",
      startDate: "2024-12-25T00:00:00Z",
      endDate: "2024-12-26T00:00:00Z",
      description: "",
      location: "",
      allDay: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("DTSTART;VALUE=DATE:");
    }
  });

  it("should handle event without description or location", async () => {
    const result = await executeTool(icalGenerator, {
      title: "Quick Call",
      startDate: "2024-01-01T09:00:00Z",
      endDate: "2024-01-01T09:30:00Z",
      description: "",
      location: "",
      allDay: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).not.toContain("DESCRIPTION:");
      expect(output).not.toContain("LOCATION:");
    }
  });

  it("should fail on invalid start date", async () => {
    const result = await executeTool(icalGenerator, {
      title: "Test",
      startDate: "invalid",
      endDate: "2024-01-01T10:00:00Z",
      description: "",
      location: "",
      allDay: false,
    });
    expect(result.success).toBe(false);
  });

  it("should contain VERSION and PRODID", async () => {
    const result = await executeTool(icalGenerator, {
      title: "Test",
      startDate: "2024-01-01T09:00:00Z",
      endDate: "2024-01-01T10:00:00Z",
      description: "",
      location: "",
      allDay: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("VERSION:2.0");
      expect(output).toContain("PRODID:");
    }
  });
});
