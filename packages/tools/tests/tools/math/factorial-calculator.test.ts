import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { factorialCalculator } from "../../../src/tools/math/factorial-calculator";

describe("Factorial Calculator", () => {
  it("should have correct metadata", () => {
    expect(factorialCalculator.meta.id).toBe("math/factorial-calculator");
    expect(factorialCalculator.meta.category).toBe("math");
  });

  it("should calculate 0!", async () => {
    const result = await executeTool(factorialCalculator, { input: "0" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("0! = 1");
    }
  });

  it("should calculate 1!", async () => {
    const result = await executeTool(factorialCalculator, { input: "1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("1! = 1");
    }
  });

  it("should calculate 5!", async () => {
    const result = await executeTool(factorialCalculator, { input: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("5! = 120");
    }
  });

  it("should calculate 10!", async () => {
    const result = await executeTool(factorialCalculator, { input: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("10! = 3628800");
    }
  });

  it("should fail on negative number", async () => {
    const result = await executeTool(factorialCalculator, { input: "-1" });
    expect(result.success).toBe(false);
  });

  it("should fail on non-integer", async () => {
    const result = await executeTool(factorialCalculator, { input: "abc" });
    expect(result.success).toBe(false);
  });

  it("should fail on number > 170", async () => {
    const result = await executeTool(factorialCalculator, { input: "171" });
    expect(result.success).toBe(false);
  });

  it("should handle 170 (max allowed)", async () => {
    const result = await executeTool(factorialCalculator, { input: "170" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("170!");
    }
  });
});
