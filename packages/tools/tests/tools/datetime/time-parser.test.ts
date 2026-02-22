import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { timeParser } from "../../../src/tools/datetime/time-parser";

describe("Time Parser", () => {
  it("should have correct metadata", () => {
    expect(timeParser.meta.id).toBe("datetime/time-parser");
    expect(timeParser.meta.category).toBe("datetime");
  });

  it("should parse 24-hour time", async () => {
    const result = await executeTool(timeParser, { input: "14:30" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.hours24).toBe(14);
      expect(data.hours12).toBe(2);
      expect(data.minutes).toBe(30);
      expect(data.period).toBe("PM");
      expect(data.formatted24).toBe("14:30:00");
      expect(data.formatted12).toBe("2:30:00 PM");
    }
  });

  it("should parse 12-hour time with AM", async () => {
    const result = await executeTool(timeParser, { input: "9:15 AM" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.hours24).toBe(9);
      expect(data.period).toBe("AM");
    }
  });

  it("should parse 12-hour time with PM", async () => {
    const result = await executeTool(timeParser, { input: "3:45 PM" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.hours24).toBe(15);
      expect(data.period).toBe("PM");
    }
  });

  it("should parse time with seconds", async () => {
    const result = await executeTool(timeParser, { input: "14:30:45" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.seconds).toBe(45);
    }
  });

  it("should include total seconds since midnight", async () => {
    const result = await executeTool(timeParser, { input: "01:00:00" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("3600");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(timeParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid time format", async () => {
    const result = await executeTool(timeParser, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should handle midnight (12:00 AM)", async () => {
    const result = await executeTool(timeParser, { input: "12:00 AM" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.hours24).toBe(0);
    }
  });

  it("should handle noon (12:00 PM)", async () => {
    const result = await executeTool(timeParser, { input: "12:00 PM" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.hours24).toBe(12);
    }
  });
});
