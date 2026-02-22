import { describe, it, expect } from "vitest";
import { ratioCalculator } from "../../../src/tools/math/ratio-calculator";
import { executeTool } from "../../../src/core/executor";

describe("ratioCalculator", () => {
  it("should have correct metadata", () => {
    expect(ratioCalculator.meta.id).toBe("math/ratio-calculator");
    expect(ratioCalculator.meta.category).toBe("math");
  });

  it("should simplify a ratio", async () => {
    const result = await executeTool(ratioCalculator, { input: "4:8" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("1:2");
  });

  it("should handle already simplified ratios", async () => {
    const result = await executeTool(ratioCalculator, { input: "3:7" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("3:7");
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(ratioCalculator, { input: "abc" });
    expect(result.success).toBe(false);
  });
});
