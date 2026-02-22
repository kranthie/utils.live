import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { weekNumber } from "../../../src/tools/datetime/week-number";

describe("Week Number", () => {
  it("should have correct metadata", () => {
    expect(weekNumber.meta.id).toBe("datetime/week-number");
    expect(weekNumber.meta.category).toBe("datetime");
  });

  it("should return ISO week 1 for early January 2024", async () => {
    const result = await executeTool(weekNumber, {
      input: "2024-01-01T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.weekNumber).toBe(1);
      expect(data.weekYear).toBe(2024);
    }
  });

  it("should return correct day of week for Monday", async () => {
    // 2024-01-08 is Monday
    const result = await executeTool(weekNumber, {
      input: "2024-01-08T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.dayOfWeek).toBe(1); // Monday = 1
    }
  });

  it("should handle Friday", async () => {
    // 2024-01-05 is Friday
    const result = await executeTool(weekNumber, {
      input: "2024-01-05T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.dayOfWeek).toBe(5);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(weekNumber, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(weekNumber, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should include formatted ISO week string", async () => {
    const result = await executeTool(weekNumber, {
      input: "2024-01-08T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("ISO Week:");
      expect((data.output as string)).toContain("2024-W02");
    }
  });

  it("should handle unix timestamp", async () => {
    const result = await executeTool(weekNumber, { input: "1704110400" });
    expect(result.success).toBe(true);
  });

  it("should return week number as positive integer", async () => {
    const result = await executeTool(weekNumber, {
      input: "2024-06-15T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.weekNumber).toBeGreaterThan(0);
      expect(data.weekNumber).toBeLessThanOrEqual(53);
    }
  });
});
