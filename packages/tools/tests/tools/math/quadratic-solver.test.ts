import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { quadraticSolver } from "../../../src/tools/math/quadratic-solver";

describe("Quadratic Solver", () => {
  it("should have correct metadata", () => {
    expect(quadraticSolver.meta.id).toBe("math/quadratic-solver");
    expect(quadraticSolver.meta.category).toBe("math");
  });

  it("should solve with two real roots (x^2 - 5x + 6 = 0)", async () => {
    const result = await executeTool(quadraticSolver, { input: "1, -5, 6" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Two real roots");
      expect(output).toContain("3");
      expect(output).toContain("2");
    }
  });

  it("should solve with one repeated root (x^2 - 4x + 4 = 0)", async () => {
    const result = await executeTool(quadraticSolver, { input: "1, -4, 4" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("One repeated root");
      expect(output).toContain("x = 2");
    }
  });

  it("should solve with complex roots (x^2 + x + 1 = 0)", async () => {
    const result = await executeTool(quadraticSolver, { input: "1, 1, 1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Two complex roots");
      expect(output).toContain("i");
    }
  });

  it("should display discriminant", async () => {
    const result = await executeTool(quadraticSolver, { input: "1, -5, 6" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Discriminant: 1");
    }
  });

  it("should fail when a=0", async () => {
    const result = await executeTool(quadraticSolver, { input: "0, 2, 3" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(quadraticSolver, { input: "abc" });
    expect(result.success).toBe(false);
  });

  it("should fail on insufficient coefficients", async () => {
    const result = await executeTool(quadraticSolver, { input: "1, 2" });
    expect(result.success).toBe(false);
  });

  it("should display equation", async () => {
    const result = await executeTool(quadraticSolver, { input: "2, 3, -5" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("2x");
    }
  });
});
