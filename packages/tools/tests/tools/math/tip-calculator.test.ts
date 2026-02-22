import { describe, it, expect } from "vitest";
import { tipCalculator } from "../../../src/tools/math/tip-calculator";
import { executeTool } from "../../../src/core/executor";

describe("tipCalculator", () => {
  it("should have correct metadata", () => {
    expect(tipCalculator.meta.id).toBe("math/tip-calculator");
    expect(tipCalculator.meta.category).toBe("math");
  });

  it("should calculate tip with defaults", async () => {
    const result = await executeTool(tipCalculator, {
      amount: 100,
      tipPercent: 20,
      split: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "$20.00"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "$120.00"
      );
    }
  });

  it("should split bill among people", async () => {
    const result = await executeTool(tipCalculator, {
      amount: 100,
      tipPercent: 20,
      split: 4,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Split 4 ways"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "$30.00"
      );
    }
  });

  it("should handle zero tip", async () => {
    const result = await executeTool(tipCalculator, {
      amount: 50,
      tipPercent: 0,
      split: 1,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "$0.00"
      );
  });
});
