import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { gcdLcmCalculator } from "../../../src/tools/math/gcd-lcm-calculator";

describe("GCD & LCM Calculator", () => {
  it("should have correct metadata", () => {
    expect(gcdLcmCalculator.meta.id).toBe("math/gcd-lcm-calculator");
    expect(gcdLcmCalculator.meta.category).toBe("math");
  });

  it("should calculate GCD and LCM of 12 and 8", async () => {
    const result = await executeTool(gcdLcmCalculator, { input: "12, 8" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("GCD(12, 8) = 4");
      expect((data.output as string)).toContain("LCM(12, 8) = 24");
    }
  });

  it("should handle coprime numbers", async () => {
    const result = await executeTool(gcdLcmCalculator, { input: "7, 13" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("GCD(7, 13) = 1");
      expect((data.output as string)).toContain("LCM(7, 13) = 91");
    }
  });

  it("should handle three or more numbers", async () => {
    const result = await executeTool(gcdLcmCalculator, {
      input: "12, 18, 24",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("GCD(12, 18, 24) = 6");
      expect((data.output as string)).toContain("LCM(12, 18, 24) = 72");
    }
  });

  it("should handle same numbers", async () => {
    const result = await executeTool(gcdLcmCalculator, { input: "5, 5" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("GCD(5, 5) = 5");
      expect((data.output as string)).toContain("LCM(5, 5) = 5");
    }
  });

  it("should fail on single number", async () => {
    const result = await executeTool(gcdLcmCalculator, { input: "5" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(gcdLcmCalculator, { input: "abc" });
    expect(result.success).toBe(false);
  });

  it("should handle negative numbers", async () => {
    const result = await executeTool(gcdLcmCalculator, { input: "-12, 8" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("= 4");
    }
  });
});
