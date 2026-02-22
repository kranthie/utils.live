import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { fibonacciGenerator } from "../../../src/tools/math/fibonacci-generator";

describe("Fibonacci Generator", () => {
  it("should have correct metadata", () => {
    expect(fibonacciGenerator.meta.id).toBe("math/fibonacci-generator");
    expect(fibonacciGenerator.meta.category).toBe("math");
  });

  it("should generate first 10 Fibonacci numbers", async () => {
    const result = await executeTool(fibonacciGenerator, { count: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0, 1, 1, 2, 3, 5, 8, 13, 21, 34");
    }
  });

  it("should generate first 1 Fibonacci number", async () => {
    const result = await executeTool(fibonacciGenerator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0");
    }
  });

  it("should generate first 2 Fibonacci numbers", async () => {
    const result = await executeTool(fibonacciGenerator, { count: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0, 1");
    }
  });

  it("should generate 20 Fibonacci numbers", async () => {
    const result = await executeTool(fibonacciGenerator, { count: 20 });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const nums = (data.output as string).split(", ");
      expect(nums.length).toBe(20);
      expect(nums[nums.length - 1]).toBe("4181");
    }
  });
});
