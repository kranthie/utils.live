import { describe, it, expect } from "vitest";
import { bmiCalculator } from "../../../src/tools/math/bmi-calculator";
import { executeTool } from "../../../src/core/executor";

describe("bmiCalculator", () => {
  it("should have correct metadata", () => {
    expect(bmiCalculator.meta.id).toBe("math/bmi-calculator");
    expect(bmiCalculator.meta.category).toBe("math");
  });

  it("should calculate BMI for normal weight", async () => {
    const result = await executeTool(bmiCalculator, {
      weight: 70,
      height: 1.75,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("22.9");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Normal weight"
      );
    }
  });

  it("should detect overweight", async () => {
    const result = await executeTool(bmiCalculator, {
      weight: 90,
      height: 1.75,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "Overweight"
      );
  });

  it("should detect underweight", async () => {
    const result = await executeTool(bmiCalculator, {
      weight: 45,
      height: 1.75,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "Underweight"
      );
  });
});
