import { describe, it, expect } from "vitest";
import { loanCalculator } from "../../../src/tools/math/loan-calculator";
import { executeTool } from "../../../src/core/executor";

describe("loanCalculator", () => {
  it("should have correct metadata", () => {
    expect(loanCalculator.meta.id).toBe("math/loan-calculator");
    expect(loanCalculator.meta.category).toBe("math");
  });

  it("should calculate monthly payment", async () => {
    const result = await executeTool(loanCalculator, {
      principal: 100000,
      annualRate: 5,
      years: 30,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "Monthly"
      );
  });

  it("should calculate with zero interest", async () => {
    const result = await executeTool(loanCalculator, {
      principal: 12000,
      annualRate: 0,
      years: 1,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("1000");
  });

  it("should show total interest", async () => {
    const result = await executeTool(loanCalculator, {
      principal: 10000,
      annualRate: 10,
      years: 5,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "Total Interest"
      );
  });
});
