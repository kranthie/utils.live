import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { julianDayConverter } from "../../../src/tools/datetime/julian-day-converter";

describe("Julian Day Converter", () => {
  it("should have correct metadata", () => {
    expect(julianDayConverter.meta.id).toBe("datetime/julian-day-converter");
    expect(julianDayConverter.meta.category).toBe("datetime");
  });

  it("should convert date to Julian Day Number", async () => {
    const result = await executeTool(julianDayConverter, {
      input: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.julianDay).toBe("number");
      expect(data.julianDay).toBe(2460311);
    }
  });

  it("should convert Julian Day Number to date", async () => {
    const result = await executeTool(julianDayConverter, {
      input: "2460311",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.iso as string)).toContain("2024-01-01");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(julianDayConverter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(julianDayConverter, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should handle J2000 epoch (JD 2451545)", async () => {
    const result = await executeTool(julianDayConverter, {
      input: "2451545",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.iso as string)).toContain("2000-01-01");
    }
  });
});
