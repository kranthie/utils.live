import { describe, it, expect } from "vitest";
import { discountCalculator } from "../../../src/tools/math/discount-calculator";
import { executeTool } from "../../../src/core/executor";

describe("discountCalculator", () => {
  it("should have correct metadata", () => {
    expect(discountCalculator.meta.id).toBe("math/discount-calculator");
    expect(discountCalculator.meta.category).toBe("math");
  });

  it("should calculate discount", async () => {
    const result = await executeTool(discountCalculator, {
      originalPrice: 100,
      discountPercent: 25,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "$25.00"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "$75.00"
      );
    }
  });

  it("should handle zero discount", async () => {
    const result = await executeTool(discountCalculator, {
      originalPrice: 50,
      discountPercent: 0,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "$50.00"
      );
  });

  it("should handle 100% discount", async () => {
    const result = await executeTool(discountCalculator, {
      originalPrice: 100,
      discountPercent: 100,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "$0.00"
      );
  });
});
