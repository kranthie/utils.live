import { describe, it, expect } from "vitest";
import { fractionCalculator } from "../../../src/tools/math/fraction-calculator";
import { executeTool } from "../../../src/core/executor";

describe("fractionCalculator", () => {
  it("should have correct metadata", () => {
    expect(fractionCalculator.meta.id).toBe("math/fraction-calculator");
    expect(fractionCalculator.meta.category).toBe("math");
  });

  it("should add fractions", async () => {
    const result = await executeTool(fractionCalculator, {
      input: "1/2 + 1/3",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("5/6");
  });

  it("should simplify fractions", async () => {
    const result = await executeTool(fractionCalculator, {
      input: "2/4 + 2/4",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("1");
  });

  it("should subtract fractions", async () => {
    const result = await executeTool(fractionCalculator, {
      input: "3/4 - 1/4",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("1/2");
  });
});
