import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { statisticsCalculator } from "../../../src/tools/math/statistics-calculator";

describe("Statistics Calculator", () => {
  it("should have correct metadata", () => {
    expect(statisticsCalculator.meta.id).toBe("math/statistics-calculator");
    expect(statisticsCalculator.meta.category).toBe("math");
  });

  it("should calculate basic statistics", async () => {
    const result = await executeTool(statisticsCalculator, {
      input: "1, 2, 3, 4, 5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Count: 5");
      expect(output).toContain("Sum: 15");
      expect(output).toContain("Mean: 3");
      expect(output).toContain("Median: 3");
      expect(output).toContain("Min: 1");
      expect(output).toContain("Max: 5");
      expect(output).toContain("Range: 4");
    }
  });

  it("should calculate median for even count", async () => {
    const result = await executeTool(statisticsCalculator, {
      input: "1, 2, 3, 4",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Median: 2.5");
    }
  });

  it("should calculate mode", async () => {
    const result = await executeTool(statisticsCalculator, {
      input: "1, 2, 2, 3, 4",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Mode: 2");
    }
  });

  it("should show no mode when all values unique", async () => {
    const result = await executeTool(statisticsCalculator, {
      input: "1, 2, 3, 4, 5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("No mode");
    }
  });

  it("should handle single value", async () => {
    const result = await executeTool(statisticsCalculator, { input: "42" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Count: 1");
      expect(output).toContain("Sum: 42");
      expect(output).toContain("Mean: 42");
    }
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(statisticsCalculator, { input: "abc" });
    expect(result.success).toBe(false);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(statisticsCalculator, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should handle negative numbers", async () => {
    const result = await executeTool(statisticsCalculator, {
      input: "-5, -3, -1, 0, 2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Min: -5");
      expect(output).toContain("Max: 2");
    }
  });

  it("should handle multiple modes", async () => {
    const result = await executeTool(statisticsCalculator, {
      input: "1, 1, 2, 2, 3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Mode:");
      expect(output).toContain("1");
      expect(output).toContain("2");
    }
  });
});
