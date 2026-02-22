import { describe, it, expect } from "vitest";
import { percentageCalculator } from "../../../src/tools/math/percentage-calculator";
import { executeTool } from "../../../src/core/executor";

describe("percentageCalculator", () => {
  it("should have correct metadata", () => {
    expect(percentageCalculator.meta.id).toBe("math/percentage-calculator");
    expect(percentageCalculator.meta.category).toBe("math");
  });

  it("should calculate percentage of a number", async () => {
    const result = await executeTool(percentageCalculator, { input: "25 200" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("50");
  });

  it("should handle decimal percentages", async () => {
    const result = await executeTool(percentageCalculator, {
      input: "33.33 300",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "99.99"
      );
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(percentageCalculator, { input: "abc" });
    expect(result.success).toBe(false);
  });
});
