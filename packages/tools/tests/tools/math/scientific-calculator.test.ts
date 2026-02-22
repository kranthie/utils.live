import { describe, it, expect } from "vitest";
import { scientificCalculator } from "../../../src/tools/math/scientific-calculator";
import { executeTool } from "../../../src/core/executor";

describe("scientificCalculator", () => {
  it("should have correct metadata", () => {
    expect(scientificCalculator.meta.id).toBe("math/scientific-calculator");
    expect(scientificCalculator.meta.category).toBe("math");
  });

  it("should calculate square root", async () => {
    const result = await executeTool(
      scientificCalculator,
      { input: "144" },
      { operation: "sqrt" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("12");
  });

  it("should calculate sine", async () => {
    const result = await executeTool(
      scientificCalculator,
      { input: "0" },
      { operation: "sin" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("0");
  });

  it("should calculate log", async () => {
    const result = await executeTool(
      scientificCalculator,
      { input: "100" },
      { operation: "log" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("2");
  });

  it("should calculate absolute value", async () => {
    const result = await executeTool(
      scientificCalculator,
      { input: "-42" },
      { operation: "abs" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("42");
  });
});
