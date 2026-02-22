import { describe, it, expect } from "vitest";
import { compoundInterest } from "../../../src/tools/math/compound-interest";
import { executeTool } from "../../../src/core/executor";

describe("compoundInterest", () => {
  it("should have correct metadata", () => {
    expect(compoundInterest.meta.id).toBe("math/compound-interest");
    expect(compoundInterest.meta.category).toBe("math");
  });

  it("should calculate compound interest", async () => {
    const result = await executeTool(compoundInterest, {
      principal: 1000,
      rate: 10,
      years: 1,
      compoundsPerYear: 1,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("1100");
  });

  it("should compound monthly", async () => {
    const result = await executeTool(compoundInterest, {
      principal: 1000,
      rate: 12,
      years: 1,
      compounding: "monthly",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Monthly compounding of 12% on $1000 for 1 year = ~$1126.83
      expect((result.data as Record<string, unknown>).output).toContain("1126");
    }
  });

  it("should handle zero rate", async () => {
    const result = await executeTool(compoundInterest, {
      principal: 1000,
      rate: 0,
      years: 10,
      compoundsPerYear: 1,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("1000");
  });
});
