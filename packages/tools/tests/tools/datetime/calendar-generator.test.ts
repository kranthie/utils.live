import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { calendarGenerator } from "../../../src/tools/datetime/calendar-generator";

describe("Calendar Generator", () => {
  it("should have correct metadata", () => {
    expect(calendarGenerator.meta.id).toBe("datetime/calendar-generator");
    expect(calendarGenerator.meta.category).toBe("datetime");
  });

  it("should generate calendar for January 2024", async () => {
    const result = await executeTool(calendarGenerator, {
      month: 1,
      year: 2024,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("January 2024");
      expect((data.output as string)).toContain("Su Mo Tu We Th Fr Sa");
    }
  });

  it("should generate calendar for February leap year", async () => {
    const result = await executeTool(calendarGenerator, {
      month: 2,
      year: 2024,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("February 2024");
      expect((data.output as string)).toContain("29");
    }
  });

  it("should generate calendar for February non-leap year", async () => {
    const result = await executeTool(calendarGenerator, {
      month: 2,
      year: 2023,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("February 2023");
      expect((data.output as string)).not.toContain("29");
    }
  });

  it("should generate calendar for December", async () => {
    const result = await executeTool(calendarGenerator, {
      month: 12,
      year: 2024,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("December 2024");
      expect((data.output as string)).toContain("31");
    }
  });
});
