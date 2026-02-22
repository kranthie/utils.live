import { describe, it, expect } from "vitest";
import { matrixCalculator } from "../../../src/tools/math/matrix-calculator";
import { executeTool } from "../../../src/core/executor";

describe("matrixCalculator", () => {
  it("should have correct metadata", () => {
    expect(matrixCalculator.meta.id).toBe("math/matrix-calculator");
    expect(matrixCalculator.meta.category).toBe("math");
  });

  it("should add matrices", async () => {
    const result = await executeTool(
      matrixCalculator,
      { input: "1,2;3,4 | 5,6;7,8" },
      { operation: "add" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("6");
  });

  it("should calculate determinant", async () => {
    const result = await executeTool(
      matrixCalculator,
      { input: "1,2;3,4" },
      { operation: "determinant" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("-2");
  });

  it("should transpose matrix", async () => {
    const result = await executeTool(
      matrixCalculator,
      { input: "1,2;3,4" },
      { operation: "transpose" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("1");
      expect((result.data as Record<string, unknown>).output).toContain("3");
    }
  });
});
