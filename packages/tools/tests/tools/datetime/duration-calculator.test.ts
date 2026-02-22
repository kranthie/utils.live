import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { durationCalculator } from "../../../src/tools/datetime/duration-calculator";

describe("Duration Calculator", () => {
  it("should have correct metadata", () => {
    expect(durationCalculator.meta.id).toBe("datetime/duration-calculator");
    expect(durationCalculator.meta.category).toBe("datetime");
  });

  it("should add two durations in HH:MM:SS format", async () => {
    const result = await executeTool(
      durationCalculator,
      { input1: "01:30:00", input2: "02:15:00" },
      { operation: "add" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.resultFormatted).toBe("03:45:00");
      expect(data.resultSeconds).toBe(13500);
    }
  });

  it("should subtract two durations", async () => {
    const result = await executeTool(
      durationCalculator,
      { input1: "05:00:00", input2: "02:30:00" },
      { operation: "subtract" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.resultFormatted).toBe("02:30:00");
    }
  });

  it("should handle negative result on subtract", async () => {
    const result = await executeTool(
      durationCalculator,
      { input1: "01:00:00", input2: "02:00:00" },
      { operation: "subtract" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.resultFormatted as string)).toContain("-");
    }
  });

  it("should parse MM:SS format", async () => {
    const result = await executeTool(
      durationCalculator,
      { input1: "30:00", input2: "15:30" },
      { operation: "add" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.resultFormatted).toBe("00:45:30");
    }
  });

  it("should parse raw seconds", async () => {
    const result = await executeTool(
      durationCalculator,
      { input1: "3600", input2: "1800" },
      { operation: "add" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.resultSeconds).toBe(5400);
    }
  });

  it("should fail on unparseable duration", async () => {
    const result = await executeTool(
      durationCalculator,
      { input1: "invalid", input2: "01:00:00" },
      { operation: "add" }
    );
    expect(result.success).toBe(false);
  });
});
