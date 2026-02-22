import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dayOfYear } from "../../../src/tools/datetime/day-of-year";

describe("Day of Year", () => {
  it("should have correct metadata", () => {
    expect(dayOfYear.meta.id).toBe("datetime/day-of-year");
    expect(dayOfYear.meta.category).toBe("datetime");
  });

  it("should return day 1 for January 1", async () => {
    const result = await executeTool(dayOfYear, {
      input: "2024-01-01T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.dayOfYear).toBe(1);
      expect(data.isLeapYear).toBe(true);
    }
  });

  it("should return correct day for mid-year", async () => {
    const result = await executeTool(dayOfYear, {
      input: "2024-07-01T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      // Jan(31) + Feb(29) + Mar(31) + Apr(30) + May(31) + Jun(30) + 1 = 183
      expect(data.dayOfYear).toBe(183);
      expect(data.isLeapYear).toBe(true);
    }
  });

  it("should identify non-leap year", async () => {
    const result = await executeTool(dayOfYear, {
      input: "2023-06-15T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isLeapYear).toBe(false);
    }
  });

  it("should calculate percentage complete", async () => {
    const result = await executeTool(dayOfYear, {
      input: "2024-07-01T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.percentComplete).toBe("number");
      expect(data.percentComplete as number).toBeGreaterThan(0);
      expect(data.percentComplete as number).toBeLessThan(100);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(dayOfYear, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(dayOfYear, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should handle unix timestamp", async () => {
    const result = await executeTool(dayOfYear, { input: "1704110400" });
    expect(result.success).toBe(true);
  });

  it("should calculate remaining days", async () => {
    const result = await executeTool(dayOfYear, {
      input: "2024-01-01T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.remaining).toBe(365); // 366 - 1
    }
  });
});
